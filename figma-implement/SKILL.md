---
name: figma-implement
description: Use when implementing UI code from a completed Figma frame. Consumes DESIGN.md, tailwind.theme.css, COMPONENTS.md, and code-connect.plan.md to generate route-level code with screenshot QA.
---

# Figma Implement

Use this skill after design handoff is complete and a finalized Figma frame URL is available. This skill turns that completed frame into route-level UI code, then verifies the result against screenshots.

Role boundary:
- `design-md`: establishes the design system, including tokens, theme artifacts, and component contracts.
- `figma-implement`: consumes a completed Figma frame plus existing handoff artifacts to implement code and run QA.

## Prerequisite Check

Before implementation, verify:
- `DESIGN.md` exists.
- `COMPONENTS.md` exists.
- `tailwind.theme.css` is imported by the app's global Tailwind entry stylesheet, usually `globals.css`.
- `code-connect.plan.md` exists. If it is missing, continue without Code Connect mappings and record that fallback.

If `DESIGN.md`, `COMPONENTS.md`, or the `tailwind.theme.css` import is missing, stop implementation and ask the developer to run the `design-md` skill first.

## Required Inputs

The developer must provide:
- Figma URL with `node-id`.
- Target route or file path to implement.
- Paths for `DESIGN.md` and `COMPONENTS.md`.

Example developer instruction:

```text
Figma URL: <url>
Route: app/page.tsx
Use DESIGN.md, tailwind.theme.css, COMPONENTS.md.
Use Code Connect mappings first.
Do not create new shared components unless existing components cannot express the design.
After implementation, compare localhost screenshot against Figma screenshot.
```

## Implementation Workflow

1. Collect the frame structure, screenshot, and assets through Figma MCP.
2. Check `code-connect.plan.md` mappings; when a mapping exists, use it first.
3. Follow the `COMPONENTS.md` Lookup Order exactly.
4. Prefer reusing or extending existing components before adding route-local or new components.
5. If a new component is necessary, record the reason before creating it.
6. After implementation, run screenshot comparison QA between the local route and the Figma screenshot.

## Component Lookup Rules

Always follow the `COMPONENTS.md` Lookup Order. If `COMPONENTS.md` defines a project-specific order, it overrides any general expectation in this skill.

Create a new component only when:
- The semantic role is different.
- The accessibility behavior is different.
- The interaction model is different.
- The design cannot be expressed through existing props, variants, slots, or composition.

If an existing component can express the Figma design through configuration or composition, reuse or extend that component instead of adding a new shared component.

## Screenshot QA

Compare the localhost screenshot against the Figma screenshot and check:
- Colors: token-applied fills, text, borders, overlays, and state colors.
- Typography: family, size, weight, line height, alignment, and wrapping.
- Spacing: padding, gaps, margins, grid alignment, and responsive breakpoints.
- Component states: default, hover, active, disabled, selected, open, loading, and error states when present in the frame or required by the interaction.
- Responsive behavior: desktop, tablet, and mobile layouts when the target route supports those viewports.

When mismatches appear:
1. Report each mismatch by item, expected Figma behavior, and observed local behavior.
2. Update the implementation.
3. Capture and compare screenshots again.
4. Repeat until the implementation matches the frame or a blocker is identified.

## Quality Bar

- Every token value applied in code traces back to `DESIGN.md` or `tailwind.theme.css`. No hardcoded hex, pixel, or font values.
- Every shared component in the output exists in `COMPONENTS.md` or includes a written justification for its creation.
- Screenshot comparison passes before claiming implementation is complete.
- If Code Connect mappings exist, they are used before any manual component matching is attempted.
