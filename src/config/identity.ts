export interface IdentityFont {
  id: string;
  display: string;
  body: string;
  mono: string;
  google_fonts_url: string;
  stack_display: string;
  stack_body: string;
  stack_mono: string;
}

export interface IdentityPalette {
  id: string;
  hue: number;
  neutral_family: string;
  accent: string;
  accent_dark: string;
  surface: string;
  surface_alt: string;
  fg: string;
  fg_muted: string;
  border: string;
  surface_dark: string;
  surface_alt_dark: string;
  fg_dark: string;
  fg_muted_dark: string;
  border_dark: string;
}

export interface IdentityLayout {
  id: "magazine" | "dashboard" | "feed" | "directory" | "longform" | "kiosk";
  component: string;
  component_path: string;
  density: "loose" | "normal" | "dense";
  brief: string;
}

export interface IdentityVoice {
  id: string;
  label_latest: string;
  label_recent: string;
  label_featured: string;
  label_more: string;
  nav_posts: string;
  nav_about: string;
  cta_subscribe: string;
  cta_subscribe_desc: string;
  cta_button: string;
  site_motto: string;
}

export interface Identity {
  font: IdentityFont;
  palette: IdentityPalette;
  layout: IdentityLayout;
  voice: IdentityVoice;
}

export const identity: Identity = {
  "font": {
    "id": "f14_serif_recoleta_dmsans",
    "display": "Tinos",
    "body": "DM Sans",
    "mono": "JetBrains Mono",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
    "stack_display": "Tinos, \"Times New Roman\", Georgia, serif",
    "stack_body": "\"DM Sans\", \"Helvetica Neue\", system-ui, sans-serif",
    "stack_mono": "\"JetBrains Mono\", ui-monospace, monospace"
  },
  "palette": {
    "id": "p30_h169_stone",
    "hue": 169,
    "neutral_family": "stone",
    "accent": "22 223 186",
    "accent_dark": "95 242 215",
    "surface": "255 255 255",
    "surface_alt": "250 250 249",
    "fg": "28 25 23",
    "fg_muted": "87 83 78",
    "border": "231 229 228",
    "surface_dark": "28 25 23",
    "surface_alt_dark": "41 37 36",
    "fg_dark": "250 250 249",
    "fg_muted_dark": "168 162 158",
    "border_dark": "68 64 60"
  },
  "layout": {
    "id": "dashboard",
    "component": "HomeDashboard",
    "component_path": "@components/clusters/HomeDashboard.astro",
    "density": "normal",
    "brief": "Sidebar + main + right rail metric cards."
  },
  "voice": {
    "id": "v08_watchdog",
    "label_latest": "Recent rulings",
    "label_recent": "Archive",
    "label_featured": "Lead investigation",
    "label_more": "Read the brief",
    "nav_posts": "Investigations",
    "nav_about": "Mission",
    "cta_subscribe": "Public brief",
    "cta_subscribe_desc": "Independent watchdog brief. Sourced. Public-interest.",
    "cta_button": "Get the brief",
    "site_motto": "Independent · Sourced · Public-interest."
  }
} as const;
