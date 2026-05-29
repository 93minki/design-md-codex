---
name: components
description: Use when creating or updating COMPONENTS.md from a Figma component URL or components page. Run this skill whenever a new Figma component is added or modified. Separate from design-md which handles design tokens.
---

# Components

Use this skill to create or update `COMPONENTS.md`, the project contract for mapping Figma components to reusable code components.

Keep responsibilities separate:

- `design-md` skill: produces design token artifacts (`DESIGN.md`, tokens, CSS) when the design system changes.
- `components` skill: creates or updates `COMPONENTS.md` when components are added or modified.

## When to Run

Run this skill when:

- A designer adds a new Figma component and publishes it to the library.
- An existing component's variant or property changes.
- A new code component has been implemented and its path must be registered in `COMPONENTS.md`.
- A project is starting and `COMPONENTS.md` needs to be created for the first time.

## Inputs

Expected inputs:

- Figma URL: either an individual component URL or the full components page URL.
- Optional codebase path: used to verify actual code component file paths.

URL behavior:

- Individual component URL: add or update only that component entry.
- Full components page URL: process every component on the page in one pass.

## COMPONENTS.md Structure

Create or update `COMPONENTS.md` with this structure:

```markdown
# Component Contract

## Lookup Order
1. components/ui
2. components/sections
3. route-local components
4. new component — reason required

## Components
| Figma Name | Code Path | Variants/Notes |
|------------|-----------|----------------|
| Button | components/ui/Button.tsx | variant=primary, size=md |

## New Component Rule
New shared components are allowed only when existing components cannot express the required UI through props, variants, slots, or composition. Every new component must include the reason existing components are insufficient.
```

Rules for the `## Components` table:

- Use the columns `Figma Name`, `Code Path`, and `Variants/Notes`.
- Use the real project-relative code path when it is confirmed.
- Use `pending` in `Code Path` when the code component is not implemented or the path cannot be confirmed.
- Preserve existing entries unless the corresponding Figma component entry is being updated.

## Generation Workflow

1. Check whether `COMPONENTS.md` already exists.
2. Use Figma MCP to collect component structure, variants, and properties from the provided Figma URL.
3. If a codebase is available, scan the `components/` directory to confirm actual component paths.
4. If `COMPONENTS.md` does not exist, create it. If it exists, add or update only the matching component entries. Do not delete existing entries.
5. Report name alignment issues: when the Figma name and code component name differ, state the mapping clearly in `Variants/Notes`.

## Naming Alignment

Without Code Connect, agents need consistent names to match Figma components to code components reliably.

- Figma component names should match code component names.
- If names differ, add a mapping note in the `Variants/Notes` column of `COMPONENTS.md`.
- When a mismatch is found, ask the designer to rename the Figma component or ask the developer to rename the code component.

## Quality Bar

- Every component in the Figma URL has a corresponding entry in `COMPONENTS.md`.
- No existing entries are deleted or overwritten unless the component itself was updated.
- Code paths use `pending` only when the component is genuinely not yet implemented.
