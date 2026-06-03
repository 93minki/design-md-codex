---
name: figma-implement-v2
description: Use when implementing UI code from a completed Figma component or page frame. Consumes DESIGN.md, tailwind.theme.css, and COMPONENTS.md to generate component-level or page-level code. V2 adds multi-frame responsive merging and shadcn/ui reuse/install handling.
---

# Figma Implement (V2)

Use this skill after design handoff is complete and a finalized Figma component or page frame URL is available. This skill turns that Figma target into component-level or page-level UI code.

> **What changed in V2**
> - **Responsive**: accept multiple breakpoint frames for one target and merge them mobile-first into a single responsive implementation.
> - **shadcn/ui**: reuse installed shadcn primitives, install missing standard shadcn components instead of hand-writing them, and respect customized shadcn (`do not regenerate`).
>
> Everything else is identical to the original `figma-implement` skill.

Role boundary:
- `design-md`: establishes the design system, including tokens, theme artifacts, and component contracts.
- `figma-implement`: consumes a completed Figma component or page frame plus existing handoff artifacts to implement code.

## Prerequisite Check

Before implementation, verify:
- `DESIGN.md` exists.
- `COMPONENTS.md` exists.
- `tailwind.theme.css` is imported by the app's global Tailwind entry stylesheet, usually `globals.css`.

If `DESIGN.md`, `COMPONENTS.md`, or the `tailwind.theme.css` import is missing, stop implementation and ask the developer to run the `design-md` skill first.

V2 additional checks, when relevant:
- If the target is responsive, confirm the breakpoint values are documented in `DESIGN.md` `## Layout`, and that custom `--breakpoint-*` (if any) are declared in `globals.css`. Use those values; never hardcode arbitrary pixel breakpoints.
- If `COMPONENTS.md` marks a needed component `shadcn`, confirm whether it is installed before reusing it.

## Implementation Targets

This skill supports two targets:

- Component-level implementation: a File A Figma component URL, such as a pending `Pricing Card`, implemented into a shared component file.
- Page-level implementation: a File B page frame URL, implemented into a route or page file using registered components.

## Required Inputs

The developer must provide:
- Figma URL with `node-id`. For a responsive target, provide one URL per breakpoint (see Responsive Implementation).
- Target component, route, or file path to implement.
- Paths for `DESIGN.md` and `COMPONENTS.md`.

Example developer instruction (single frame):

```text
Figma URL: <url>
Target: components/sections/PricingCard.tsx or app/page.tsx
Use DESIGN.md, tailwind.theme.css, COMPONENTS.md.
Do not create new shared components unless existing components cannot express the design.
```

Example developer instruction (responsive, multiple frames):

```text
같은 화면의 breakpoint별 프레임이야. 하나로 병합해서 반응형으로 구현해줘.
  mobile  : <File B frame URL with node-id>
  tablet  : <File B frame URL with node-id>
  desktop : <File B frame URL with node-id>
Target: app/[route]/page.tsx
base=mobile, md:=tablet, lg:=desktop 차이만 덮어써줘.
Use DESIGN.md, tailwind.theme.css, COMPONENTS.md. breakpoint 값은 globals.css의 --breakpoint-* 기준.
```

## Responsive Implementation (V2)

A Figma frame is a single fixed-size snapshot. Layout reflow across breakpoints lives in **separate frames**, and the agent does not automatically know that several frames are the same screen. Responsive merging requires three conditions:

1. **Multiple frames provided together** — one frame per breakpoint for the same target, in a single request.
2. **Identity signal** — the frames use the same File A component instances (same component key/name) or consistent layer naming, so corresponding nodes can be matched across breakpoints.
3. **Merge instruction** — the developer states these are breakpoint variants of one screen.

When these hold, merge mobile-first:

1. Read each frame's node tree via Figma MCP.
2. Match corresponding nodes across the frames using component instance identity / layer names.
3. Diff per-node responsive properties: width, height, `layoutMode` (flex direction), wrap, gap, padding, alignment, visibility.
4. Emit base styles from the smallest breakpoint, then override only the differences at larger breakpoints using Tailwind breakpoint prefixes.
   - `layoutMode: VERTICAL` → `flex-col`; `HORIZONTAL` → `flex-row`. Example diff: mobile `VERTICAL`, desktop `HORIZONTAL` → `flex-col lg:flex-row`.
   - `itemSpacing` → `gap-*`; sizing modes → `w-full` / `w-fit` / fixed `w-*` with breakpoint prefixes.
5. Use only token-backed or breakpoint-prefixed utilities. Breakpoint widths/values must trace to `DESIGN.md` `## Layout` / `globals.css` `--breakpoint-*`; no hardcoded `min-width: 900px`-style values.

If only a single frame is provided for a clearly responsive screen, implement what is given and report that the result is fixed to that breakpoint and that additional breakpoint frames are needed for responsive behavior — do not invent breakpoint behavior.

## shadcn/ui Handling (V2)

Follow `COMPONENTS.md` origin information (`shadcn`, `shadcn (customized)`, `custom`) for each node.

- **`shadcn`, already installed** → reuse the existing `components/ui` primitive. Configure it via props/variants; do not re-style from scratch.
- **`shadcn`, not yet installed** → install the canonical component rather than hand-writing it:

  ```bash
  npx shadcn@latest add <name>
  ```

  Then update `COMPONENTS.md` (`pending` → `components/ui/<name>.tsx`, `Origin: shadcn`) and use it. Do not author a standard shadcn primitive by hand.
- **`shadcn (customized)`** → respect the `do not regenerate` flag. Never re-run `npx shadcn add` over it. Use the existing customized component and its local variant/prop API as recorded in `COMPONENTS.md`. If a new customization is required, edit the existing file and update its `COMPONENTS.md` notes.
- **`custom`** → follow the normal Lookup Order: reuse/extend if it exists, implement if `pending`, or create with a recorded reason only when nothing existing can express it.

A Figma component is a design spec, not importable code. "Using the designer's component" means reading its structure/variants and mapping to existing code or implementing code from it — never importing the Figma node directly.

## Implementation Workflow

1. Collect the frame structure and assets through Figma MCP. For a responsive target, collect all provided breakpoint frames.
2. Follow the `COMPONENTS.md` Lookup Order exactly, honoring each entry's `Origin`.
3. Prefer reusing or extending existing components before adding route-local or new components.
4. For shadcn nodes, reuse if installed, install-then-register if a standard shadcn component is missing, and respect `do not regenerate` for customized shadcn.
5. For component-level implementation, update the matching `COMPONENTS.md` entry from `pending` to the implemented path after code is created.
6. For page-level implementation, reuse components already mapped in `COMPONENTS.md` before creating route-local code.
7. For responsive targets, merge the breakpoint frames mobile-first per the Responsive Implementation section.
8. If a new component is necessary, record the reason before creating it.
9. Report the implemented path, any `COMPONENTS.md` updates (including newly installed shadcn paths), responsive coverage (which breakpoints were merged), and any blockers.

## Component Lookup Rules

Always follow the `COMPONENTS.md` Lookup Order. If `COMPONENTS.md` defines a project-specific order, it overrides any general expectation in this skill.

Create a new component only when:
- The semantic role is different.
- The accessibility behavior is different.
- The interaction model is different.
- The design cannot be expressed through existing props, variants, slots, or composition.

If an existing component can express the Figma design through configuration or composition, reuse or extend that component instead of adding a new shared component.

## Quality Bar

- Every token value applied in code traces back to `DESIGN.md` or `tailwind.theme.css`. No hardcoded hex, pixel, or font values.
- Responsive output uses breakpoint-prefixed utilities tied to documented breakpoints; no hardcoded pixel breakpoints.
- shadcn primitives are reused or installed via the shadcn CLI, never hand-rewritten; customized shadcn is never regenerated.
- Every shared component in the output exists in `COMPONENTS.md` or includes a written justification for its creation.
