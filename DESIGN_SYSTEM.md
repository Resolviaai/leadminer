# LeadMiner Design System Specification

> **Version**: 1.0.0  
> **Aesthetic**: Supabase Studio Dark Minimalist + Jensen Huang SaaS Grid  
> **Primary Brand Anchor**: `#C46A3A` (Warm Brand Copper / Orange)  
> **Surface Base**: `#161616` (Deep Charcoal Studio Canvas)  
> **Strict Guideline**: Anti-AI Vibecoding Standards (Zero Decorative Emojis, No AI Neon Palettes)

---

## 1. Core Design Philosophy

LeadMiner is an enterprise-grade creator intelligence and outreach infrastructure platform. Its visual language must evoke **stability, calculation, and precision** (The Jensen Huang SaaS Grid), combined with **minimalist utilitarian elegance** (The Steve Jobs Clean System).

### The Three Golden Rules
1. **Strict 4-Layer Architecture**: Every pixel sits on an explicit elevation layer. Never pick arbitrary hex colors.
2. **Zero Decorative Emojis**: Never use native OS emojis (🚀, 💡, 🔥, ⚡, 📦) as interface icons. Use crisp 16px–20px SVG vector icons (`lucide-react`) with 1.5px to 2px consistent strokes.
3. **Data-Driven Typographic Alignment**: Numbers, percentages, and currencies are set in monospace (`font-mono tabular-nums`) and right-aligned or baseline-aligned by place value.

---

## 2. The 4-Layer Color Architecture

All interfaces are built on a strict 4-layer tonal stack:

```
┌────────────────────────────────────────────────────────────┐
│ Layer 3: Functional Accents & Semantics                    │
│   • Brand CTA (#C46A3A / hover: #D17A45)                   │
│   • Status Semantics: Success #22C55E, Warning #F59E0B     │
├────────────────────────────────────────────────────────────┤
│ Layer 2: Nested Containers, Form Inputs, Wells             │
│   • bg-surface-200 (#232323) | bg-surface-300 (#282828)   │
│   • border-border (#2E2E2E) or border-border/50           │
├────────────────────────────────────────────────────────────┤
│ Layer 1: Elevated Surfaces & Cards                         │
│   • bg-surface-100 (#1C1C1C)                               │
│   • border-border (#2E2E2E)                                │
├────────────────────────────────────────────────────────────┤
│ Layer 0: Root Canvas / Background                          │
│   • bg-studio / bg-background (#161616)                    │
└────────────────────────────────────────────────────────────┘
```

### Color Token Reference Table

| Token | Hex Value | Tailwind Class | Usage / Intent |
| :--- | :--- | :--- | :--- |
| **Canvas** | `#161616` | `bg-studio`, `bg-background` | Page background, root layout |
| **Surface 100** | `#1C1C1C` | `bg-surface-100`, `bg-card` | Elevated cards, top header bars, modal sheets |
| **Surface 200** | `#232323` | `bg-surface-200`, `bg-secondary` | Nested data wells, input backgrounds, table rows |
| **Surface 300** | `#282828` | `bg-surface-300`, `bg-muted` | Deep inputs, slider tracks, inactive tab wells |
| **Border Default** | `#2E2E2E` | `border-border`, `border-studio-border` | Card borders, dividers, standard outlines |
| **Border Subtle** | `#232323` | `border-border/50`, `border-studio-border-subtle` | Inner grid dividers, row separators |
| **Border Strong** | `#343434` | `border-studio-border-strong` | Hover borders, active cards |
| **Brand Primary** | `#C46A3A` | `bg-primary`, `text-primary` | Primary action buttons, active tab indicators, focus rings |
| **Brand Hover** | `#D17A45` | `hover:bg-brand-hover` | Hover state for primary buttons |
| **Brand Soft** | `#241713` | `bg-accent`, `bg-primary/15` | Active badges, selected card backgrounds |
| **Text Main** | `#EDEDED` | `text-text-main`, `text-foreground` | Primary headings, prominent values, active labels |
| **Text Secondary** | `#A0A0A0` | `text-text-secondary`, `text-muted-foreground` | Subtitles, field labels, metadata |
| **Text Muted** | `#707070` | `text-text-muted` | Captions, secondary timestamps, unit markers |
| **Semantic Success** | `#22C55E` | `text-success`, `text-emerald-400`, `bg-success/15` | Online status, confirmed sends, active campaigns |
| **Semantic Warning** | `#F59E0B` | `text-warning`, `text-amber-400`, `bg-warning/15` | Soft rate limits, pending actions, paused status |
| **Semantic Danger** | `#EF4444` | `text-destructive`, `text-rose-400`, `bg-destructive/15` | Disconnect, delete, failed sends, bounce errors |

---

## 3. Typography & Hierarchy

- **Base Font**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace Font**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Letter Spacing**: `-0.01em` body tracking; tight headings.

### Typographic Scale

| Role | Class | Specs | Example |
| :--- | :--- | :--- | :--- |
| **Page Title** | `text-base sm:text-lg font-semibold text-text-main tracking-tight` | 16–18px, Semi-bold | "Templates & Follow-Up Sequences" |
| **Section Title** | `text-sm font-semibold text-text-main` | 14px, Semi-bold | "Sequence Pipeline Steps" |
| **Card Title** | `text-xs sm:text-sm font-semibold text-text-main` | 12–14px, Semi-bold | "Dynamic Capacity Allocation" |
| **Body / Subtitle** | `text-xs text-text-secondary leading-relaxed` | 12px, Regular | "Create and manage outreach sequences..." |
| **Field Label** | `text-[10px] font-medium uppercase tracking-wider text-text-muted` | 10px, Medium, Caps | "DELAY (DAYS)" |
| **Data Metric Large**| `text-lg sm:text-2xl font-bold text-text-main font-mono tabular-nums` | 18–24px, Bold, Mono | "100", "25 / day" |
| **Data Metric Small**| `text-xs sm:text-sm font-mono font-semibold text-text-main tabular-nums` | 12–14px, Semi-bold, Mono | "~13 / day / inbox" |
| **Caption / Help** | `text-[11px] text-text-muted` | 11px, Regular | "Dispatched Monday through Friday..." |

---

## 4. Standard Page Layout & Container Grid

Every main page in LeadMiner follows the Jensen Huang SaaS Grid:
- **Max Width**: `max-w-7xl mx-auto w-full`
- **Vertical Spacing**: `space-y-4 sm:space-y-5`
- **No Full-Bleed Sections**: Content is always contained within bounded cards.

### Standard Page Header Pattern
```tsx
<Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border bg-surface-100">
  <div>
    <div className="flex items-center space-x-2">
      <Icon className="w-5 h-5 text-primary" />
      <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
        Page Title
      </h1>
    </div>
    <p className="text-xs text-text-secondary mt-0.5">
      Concise description of page functionality and data scope.
    </p>
  </div>

  {/* Right Action or Segmented Controls */}
  <div className="flex items-center gap-2">
    ...
  </div>
</Card>
```

---

## 5. UI Component Specifications

### 1. Buttons (`@/components/ui/button`)
- **Primary CTA (Brand)**:
  `bg-primary text-white font-semibold text-xs rounded-lg px-4 py-2 hover:bg-brand-hover active:scale-[0.98] shadow-sm transition-all min-h-[38px]`
- **Secondary / Outline**:
  `border border-border bg-surface-100 hover:bg-surface-200 text-text-secondary hover:text-text-main text-xs rounded-lg px-3 py-1.5 active:scale-[0.98] transition-all`
- **Destructive**:
  `border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs rounded-lg px-3 py-1.5`

### 2. Badges (`@/components/ui/badge`)
- **Default (Brand Accent)**: `bg-primary/15 text-primary border border-primary/30 text-[11px] font-medium rounded-full px-2.5 py-0.5`
- **Secondary (Subtle)**: `bg-surface-200 border border-border text-text-secondary text-[11px] font-medium rounded-full px-2.5 py-0.5`
- **Success (Semantic Only)**: `bg-success/15 border border-success/30 text-success text-[11px] font-medium rounded-full px-2.5 py-0.5`
- **Warning (Semantic Only)**: `bg-warning/15 border border-warning/30 text-warning text-[11px] font-medium rounded-full px-2.5 py-0.5`
- **Destructive (Semantic Only)**: `bg-destructive/15 border border-destructive/30 text-destructive text-[11px] font-medium rounded-full px-2.5 py-0.5`

### 3. Segmented Tab Switchers
Used to switch views (e.g. Email Templates vs Follow-Up Sequences):
```tsx
<div className="flex items-center p-1 bg-surface-200 border border-border rounded-lg shrink-0">
  <button
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.98]",
      isActive
        ? "bg-surface-100 text-text-main shadow-sm border border-border font-semibold"
        : "text-text-muted hover:text-text-secondary"
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>Tab Name</span>
    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-300 text-text-secondary">
      Count
    </span>
  </button>
</div>
```

### 4. Form Controls (Inputs, Selects, Sliders)
- **Inputs**: `bg-surface-300 border border-border text-text-main text-xs rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono`
- **Dropdowns (Selects)**: `bg-surface-300 border border-border text-text-main text-xs rounded-lg px-3 py-2 outline-none focus:border-primary`
- **Range Sliders**: `w-full accent-primary bg-surface-200 h-1.5 rounded-lg appearance-none cursor-pointer`
- **Radio Cards**:
  - Unselected: `bg-surface-100 border border-border text-text-secondary hover:bg-surface-200/50`
  - Selected: `bg-surface-200 border border-primary/50 text-text-main shadow-sm` (radio button `accent-primary`)

---

## 6. Sequence & Timeline Builder Pattern (Instantly.ai Style Adapted)

When rendering multi-step sequence pipelines:
1. **Vertical Connected Rail**:
   - Step nodes connected by a vertical line (`w-0.5 bg-border`).
   - Between steps: centered pill showing delay:
     `Wait [ X ] days` inside `bg-surface-200 border border-border px-2.5 py-1 rounded-full text-[11px] text-text-secondary font-mono`.
2. **Step Cards**:
   - Enclosed in `bg-surface-100 border border-border rounded-xl p-4`.
   - Step badge in header: `w-6 h-6 rounded-md bg-surface-200 border border-border font-mono font-semibold text-xs text-text-main`.
   - Active step has subtle highlight: `border-primary/50 shadow-sm`.
   - Action buttons: Trash icon `text-text-muted hover:text-destructive`.
3. **Capacity & Governor Panel (Right Column)**:
   - Dynamic $\Phi$ allocation bar:
     - New Leads: Brand Orange `bg-primary`
     - Follow-Ups: Charcoal Slate `bg-surface-300 border border-border`
     - Clean typography and monospace counts.

---

## 7. Strict Anti-Patterns & Prohibitions

| Prohibited Anti-Pattern | Correct Design System Pattern |
| :--- | :--- |
| Arbitrary neon greens (`#10b981`, `#059669`) for buttons or headers | Use Brand Orange (`bg-primary` / `#C46A3A`) for primary actions |
| Neon cyan (`#06b6d4`) for borders, badges, progress bars | Use subtle slate `bg-surface-300` and `border-border` |
| Native OS emojis (🚀, 💡, 🔥, ⚡, 📦) in UI | Standard Lucide SVG icons with consistent 1.5px stroke |
| Doubled page headers / nested title bars | Single top Header Card with inline tabs |
| Large flashy banners with AI gradients | Clean, contained cards with clear information hierarchy |
| Uncontrolled text sizes across pages | Strict 10px / 11px / 12px / 14px / 16px typographic scale |
