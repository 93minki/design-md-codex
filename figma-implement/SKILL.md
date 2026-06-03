---
name: figma-implement
description: Use when implementing UI code from a completed Figma component or page frame. Consumes DESIGN.md, tailwind.theme.css, and COMPONENTS.md to generate component-level or page-level code.
---

# Figma Implement

Use this skill after design handoff is complete and a finalized Figma component or page frame URL is available. This skill turns that Figma target into component-level or page-level UI code.

Role boundary:
- `design-md`: establishes the design system, including tokens, theme artifacts, and component contracts.
- `figma-implement`: consumes a completed Figma component or page frame plus existing handoff artifacts to implement code.

## Prerequisite Check

Before implementation, verify:
- `DESIGN.md` exists.
- `COMPONENTS.md` exists.
- `tailwind.theme.css` is imported by the app's global Tailwind entry stylesheet, usually `globals.css`.

If `DESIGN.md`, `COMPONENTS.md`, or the `tailwind.theme.css` import is missing, stop implementation and ask the developer to run the `design-md` skill first.

## Implementation Targets

This skill supports two targets:

- Component-level implementation: a File A Figma component URL, such as a pending `Pricing Card`, implemented into a shared component file.
- Page-level implementation: a File B page frame URL, implemented into a route or page file using registered components.

## Required Inputs

The developer must provide:
- Figma URL with `node-id`.
- Target component, route, or file path to implement.
- Paths for `DESIGN.md` and `COMPONENTS.md`.

Example developer instruction:

```text
Figma URL: <url>
Target: components/sections/PricingCard.tsx or app/page.tsx
Use DESIGN.md, tailwind.theme.css, COMPONENTS.md.
Do not create new shared components unless existing components cannot express the design.
```

## Implementation Workflow

1. Collect the frame structure and assets through Figma MCP.
2. Follow the `COMPONENTS.md` Lookup Order exactly.
3. Prefer reusing or extending existing components before adding route-local or new components.
4. For component-level implementation, update the matching `COMPONENTS.md` entry from `pending` to the implemented path after code is created.
5. For page-level implementation, reuse components already mapped in `COMPONENTS.md` before creating route-local code.
6. If a new component is necessary, record the reason before creating it.
7. Report the implemented path, any `COMPONENTS.md` updates, and any blockers.

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
- Every shared component in the output exists in `COMPONENTS.md` or includes a written justification for its creation.
