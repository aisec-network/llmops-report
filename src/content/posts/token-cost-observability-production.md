---
title: "Token-Cost Observability in Production: What You Measure vs What You Should"
description: "Most LLM apps track total spend and call it done. The interesting signals — per-feature cost, per-user attribution, anomaly bands — require deliberate instrumentation."
pubDate: 2026-05-07
author: "Priya Anand"
tags: ["observability", "cost-monitoring", "llm-ops", "production-llm", "token-tracking"]
category: "ops"
sources:
  - title: "OpenLLMetry: OpenTelemetry for LLMs"
    url: "https://github.com/traceloop/openllmetry"
  - title: "Helicone: LLM Observability"
    url: "https://www.helicone.ai/"
  - title: "LangSmith Tracing"
    url: "https://docs.smith.langchain.com/"
  - title: "OpenAI Pricing Page"
    url: "https://openai.com/api/pricing/"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/llmops.report/token-cost-observability-production.png
heroAlt: "Token cost dashboard visualization"
---

The most common LLM cost-tracking setup I see in production is a single dashboard widget that says "$X this month." It tells you the bill is growing. It does not tell you why, who is responsible, or whether the growth is healthy. By the time it tells you something is wrong, you've burned a week of budget on a misbehaving feature.

Here's the gap between what teams typically measure and what's actually useful for operating an LLM application at scale.

## What teams measure

In rough order of prevalence:

1. Total tokens per day, summed across all calls
2. Total dollar spend per day from the provider's billing API
3. Average cost per request
4. Maybe — top 5 most expensive endpoints

This stack tells you the surface. It misses the structure.

## What you actually need

### Per-request lineage

Every call should emit a structured event with: `request_id`, `user_id`, `feature`, `model`, `prompt_tokens`, `completion_tokens`, `total_cost_usd`, `latency_ms`, `error_class`. Missing any one of these makes the rest of the analysis impossible.

OpenTelemetry conventions for LLM spans are now standardized; [OpenLLMetry](https://github.com/traceloop/openllmetry) is the most adopted implementation. If you're starting fresh, use it. If you have a homegrown system, validate the schema matches `gen_ai.*` semantic conventions so future tooling doesn't require migrations.

### Cost attribution by feature

A single LLM application typically has 5-15 distinct call sites: summarization, classification, embedding, agent reasoning step, retry-on-low-confidence, etc. Each has different value-per-dollar to the business. Tag every call with a `feature` label at the call site, not derived later from prompt fingerprinting (which breaks when prompts evolve).

Build a top-N table of features by daily cost. The shape changes weekly; the pattern of changes is the signal. A feature whose cost doubled with no traffic increase is leaking — usually a prompt change that bloated context.

### Per-user cost distribution

Most teams underprice power users by 20-40%. The math is straightforward: pull cost-per-user across last 30 days, plot the distribution. The right tail is much heavier than uniform pricing assumes. Either price-tier accordingly, or implement per-user quotas to prevent the top 1% from absorbing the margin.

Important caveat: if your application aggregates queries across users (shared cache, batch processing), naive per-user attribution overcounts. Track at the call site that owns the work, not just at the API boundary.

### Anomaly bands per feature

The default "alert when daily cost exceeds threshold" wakes you up after the loss is locked in. Better: a rolling 7-day-trailing band per feature, alert when a single hour exceeds the band's 3-sigma. This catches:

- A prompt-engineering change that quietly added 1000 tokens to every call
- A retry loop that's now hitting `max_attempts=10` for 5% of users
- A new tool call returning verbose output that bloats subsequent context
- A scraper or attacker hitting an exposed endpoint

We've caught all four in production with this single rule. The latency-cost product is also a good band — when latency spikes faster than cost, you have a queueing or concurrency problem; when cost spikes faster than latency, you have a payload-size problem.

### Cache hit rate and savings

Every production LLM app should have semantic and exact-match caching layers. The [metrics](https://mlobserve.com/) that matter:

- Hit rate per feature
- Dollar savings (sum of avoided calls × estimated cost)
- Stale-cache rate (cache served data older than its valid window)

Without these, you can't tell if a cache change improved or degraded the app. [Helicone](https://www.helicone.ai/) and [LangSmith](https://docs.smith.langchain.com/) both expose cache analytics; if you're rolling your own, the math is simple but the dashboard usually isn't built.

### Error-class attribution

Errors are also costs. A `429` retried 5 times costs 5x. A `500` that triggers a fallback to GPT-4 from GPT-4o-mini changes the unit cost by 10x. Track error class as a dimension on every cost metric. When a provider has a regional outage, you want to see the cost spike isolated to that error class, not buried in the aggregate.

## A reasonable stack

Minimum viable observability for a serious production LLM app:

1. **OpenLLMetry-compatible tracing** instrumenting every call site with feature + user labels.
2. **A 90-day retention** on the trace data — long enough for week-over-week comparisons, short enough to not blow your storage budget.
3. **5 dashboards**: total cost trend, top features by cost, top users by cost, cache hit rate by feature, error-class cost attribution.
4. **2 alerts**: per-feature 3-sigma anomaly, per-user runaway (a user suddenly costing 10x their 7-day average).
5. **Weekly review**: a Monday-morning ritual where someone owns the dashboards. Without this, the stack rots inside two months.

You don't need a vendor for any of this. You need the discipline to label calls correctly at the call site and the willingness to look at the dashboards weekly.

## What we don't recommend

Don't trust the provider's billing API as your primary cost source. It lags 24-72 hours, doesn't break down by call site, and silently changes its schema. Compute costs from your own token counts using current published rates. The provider's number is for reconciling the credit-card charge; your number is for operating.

Don't over-instrument with vendor-specific SDKs that lock you in. The semantic conventions are stable enough now that vendor switching should be a configuration change, not a rewrite.

Don't optimize cost before measuring it. Most "cost optimizations" are actually quality regressions in disguise. Measure first, then optimize the items that show up. Most cost is concentrated in the top 3 features; the long tail isn't worth touching.

For more context, [ML monitoring practices](https://mlmonitoring.report/) covers related topics in depth.
