---
title: "Model Registry Patterns That Actually Work"
description: "What the hype skips about model registries, what mature teams actually do, and how to avoid the metadata graveyard most registries become."
pubDate: 2026-05-08
tags: ["model-registry", "mlops", "governance", "deployment"]
category: "mlops"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/llmops.report/model-registry-patterns.png
heroAlt: "Model registry patterns in production ML systems"
---

Everyone building a serious ML system eventually needs a model registry. The pitch is simple: a central place to version, store, and manage models. Track which model is in production. Roll back when something goes wrong. Audit who deployed what and when.

In practice, most registries become a metadata graveyard within six months. Thousands of model versions nobody can explain. Tags that mean nothing. A "production" stage that nobody trusts to actually reflect what's live.

Here's what actually works.

## What the hype skips

Model registry vendors and tutorials focus on the artifact storage and lineage tracking use cases, and those are real. But they skip the hard problems:

**The registry is not your source of truth for what's in production.** Your serving infrastructure is. If your model is deployed to Kubernetes, the running pod is what's live. The registry just tracks what should be live, and only if someone bothered to update it. In teams that don't enforce registry updates as part of deployment, the registry and production diverge within weeks.

**Metadata quality degrades unless you automate it.** Nobody manually fills in accuracy metrics, training dataset versions, and hyperparameter configs after their fifteenth model iteration of the day. You have to capture this automatically at training time or it doesn't happen.

**Promotion workflows are political, not technical.** The real challenge with model registries isn't versioning — it's deciding who has authority to promote a model from staging to production, what evidence is required, and how to handle rollbacks when stakeholders disagree. That's a process problem. Clicking "promote" in an MLflow UI doesn't solve it.

## What mature teams actually do

**Treat the registry as a read-only view of training runs, not a place to manually curate.** Every training run that completes logs its artifacts, metrics, and metadata to the registry automatically. Nobody manually adds models. Nobody decides after the fact what to record. The registry reflects training output, period.

This requires your training code to be instrumented with logging from the start. It's easier in MLflow or W&B than in custom solutions because they have lightweight logging clients. The key discipline is: the training script logs everything, or the run is rejected.

**Separate "model artifact" from "model deployment".** A model artifact is a serialized set of weights plus metadata. A deployment is an artifact plus routing configuration plus serving infrastructure config. Most teams conflate these, and then the registry tries to do both jobs badly.

A cleaner pattern: the registry manages artifacts and tracks which artifact is "approved for production use." A separate deploy system (Argo CD, internal tooling, Kubernetes operator) manages the actual serving configuration and pulls from the registry by artifact ID. The two systems sync, but they're not the same system.

**Use the stage field sparingly.** MLflow's stage field (`None`, `Staging`, `Production`, `Archived`) sounds useful but encourages teams to treat it as their production truth. Better pattern: use it as a soft signal and enforce real production state through your CD pipeline's deployment history. A model is in production because your CD system deployed it, not because someone clicked "Production" in the registry UI.

**Lock down who can push to the registry.** If developers can push arbitrary model artifacts directly to the registry, you'll end up with thousands of untested model versions and no confidence in anything tagged "production." Only promote from CI. Train locally, push to experiment tracking, promote to the official registry only after automated evaluation passes.

## The evaluation gate problem

The stickiest unsolved problem in model registries: what evidence do you require before promoting a model?

Most teams start with: offline evaluation on a held-out set. This is necessary but not sufficient. It doesn't catch training/serving skew. It doesn't catch failures on specific user cohorts. It doesn't catch performance degradation on the tail of the distribution.

Mature teams add:

**Canary evaluation.** Before full promotion, route 1–5% of live traffic to the challenger model and compare against champion on real requests. This requires infrastructure for A/B routing at the serving layer, which is work. It's also the most reliable signal you can get.

**Shadow evaluation.** Run the challenger model in parallel with the champion on live traffic, logging both predictions but only serving the champion's. Compare offline. Slower than canary but lower risk.

**Invariant checks.** Before any model goes to production, run it against a fixed set of inputs where you know the expected output range. If a fraud model that should score a test transaction near 0.9 suddenly scores it at 0.2, something is wrong regardless of what aggregate metrics say.

## The metadata nobody collects but everyone needs

When a model fails in production at 2am, the person debugging it needs:

- What training data was this trained on? Date range, filters applied, dataset version
- What features were used? Exact feature list at training time
- What preprocessing was applied? In what order?
- What were the eval metrics on the validation set?
- What was the threshold used for binary classification decisions?
- Who approved this for production and when?

Most registries have fields for all of this. Most registries have most of it blank. Log it automatically at training time or accept that your 2am debugging sessions will include a lot of digging through notebooks.

## Tooling choices

For most teams, MLflow or W&B handles 80% of registry needs adequately. The remaining 20% is your governance layer — who can promote, what checks must pass, how deployments are tracked — and that's almost always custom regardless of what registry you pick.

Don't pick a registry based on its UI or its marketing positioning around "model governance." Pick based on how well its logging client fits your training infrastructure and whether you can wire it into your CD pipeline via API. The UI you'll grow out of. The API you'll depend on forever.
