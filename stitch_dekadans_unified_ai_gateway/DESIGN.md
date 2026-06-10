---
name: Dekadans AI Core
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#f7f8f8'
  on-tertiary: '#2f3131'
  tertiary-container: '#dbdbdb'
  on-tertiary-container: '#5e6060'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for a high-performance AI gateway, prioritizing technical precision, speed, and developer trust. The aesthetic sits at the intersection of **Minimalism** and **Glassmorphism**, leveraging a dark-mode first approach to reduce eye strain during prolonged sessions. 

The visual narrative is defined by:
- **Sophisticated Technicality:** Utilizing monospaced accents to signal the "under the hood" power of the AI.
- **Deep Dimensionality:** Using semi-transparent layers and background blurs to create an organized stack of information.
- **Neon Precision:** High-energy cyan and purple accents are used sparingly to guide the eye toward critical actions and system statuses without overwhelming the workspace.

## Colors

The palette is anchored in a "Deep Space" theme.
- **Base Background:** `#0A0C10` is used for the primary canvas to provide maximum contrast for the glow effects.
- **Surface Elevation:** `#0D1117` creates subtle differentiation for cards and sidebar containers.
- **Primary Accent:** Electric Cyan (`#00F2FF`) is reserved for primary actions, success states, and active code highlights.
- **Secondary Accent:** Soft Purple (`#A855F7`) is used for secondary data points, AI-specific features, and decorative gradients.
- **Feedback:** Use pure white for high-readability text and muted greys for metadata.

## Typography

This design system utilizes a dual-font strategy to balance legibility with a "developer-first" feel. 
- **Inter** handles all major interface communication, providing a neutral, highly readable foundation that scales from dense dashboards to marketing headlines.
- **JetBrains Mono** is the functional workhorse for technical data. It must be used for API keys, terminal outputs, code snippets, and micro-labels (tags/chips). 
- **Formatting:** Use sentence case for UI labels and all-caps for `label-mono` when used in navigation or small status indicators to enhance the "control panel" aesthetic.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with a focus on high information density.
- **Grid:** A 12-column system for desktop, collapsing to 4 columns for mobile.
- **Rhythm:** An 8px linear scale (4, 8, 16, 24, 32, 48, 64) ensures consistent vertical rhythm.
- **Margins:** Large horizontal margins on desktop (48px+) keep content centered and readable, while sidebar-heavy views (Dashboards) utilize a pinned 240px navigation rail with a fluid content area.
- **Adaptation:** On mobile, complex data tables should transition to card-based summaries to maintain the minimalist clarity.

## Elevation & Depth

Depth is achieved through layering rather than traditional heavy shadows.
- **Glassmorphism:** Use a `backdrop-filter: blur(12px)` on modal overlays, navigation bars, and dropdown menus. The background of these elements should be a semi-transparent black (`rgba(10, 12, 16, 0.7)`).
- **Glows:** Instead of drop shadows, use **Outer Glows** for active elements. A primary button might have a subtle `0px 0px 15px rgba(0, 242, 255, 0.3)` glow to simulate light emission.
- **Thin Borders:** Define hierarchy using 1px borders. Use `rgba(255, 255, 255, 0.1)` for standard containers and `rgba(0, 242, 255, 0.4)` to indicate focus or "active" states.

## Shapes

The shape language is "Soft-Geometric." 
- **Corner Radius:** A base radius of `4px` (Soft) is applied to buttons, inputs, and cards. This provides a modern, precise feel without being overly aggressive (sharp) or too consumer-focused (pill).
- **Exceptions:** Status dots and notification badges are fully circular. Code block containers should maintain the standard `4px` radius to align with the grid.

## Components

- **Buttons:** 
  - *Primary:* Cyan background, black text, subtle cyan outer glow on hover. 
  - *Secondary:* Ghost style with a 1px white/10% border, turning to white/20% on hover.
- **Cards:** Frameless appearance. Use a 1px border (`#ffffff1a`) and a very subtle gradient background from top-left to bottom-right.
- **Inputs:** Darker than the surface background. Use JetBrains Mono for the text. Focus state triggers a 1px Cyan border and a subtle internal glow.
- **Chips/Labels:** Small, all-caps JetBrains Mono text. Use a subtle background tint of the accent color (e.g., 10% opacity Cyan for "Success").
- **Data Visualization:** Use thin, 2px stroke lines for charts. Area charts should use a gradient fill from the accent color to transparent. Use Cyan for "Inbound" and Purple for "Outbound" data flows.
- **Code Snippets:** High-contrast background (`#000000`). Syntax highlighting should follow the Cyan and Purple palette, using secondary greys for comments.