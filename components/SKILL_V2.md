---
name: components-v2
description: Use when creating or updating COMPONENTS.md from a Figma component URL or components page. Run this skill whenever a new Figma component is added or modified. Separate from design-md which handles design tokens. V2 adds shadcn/ui detection, origin tracking, and customized-component handling.
---

# Components (V2)

Use this skill to create or update `COMPONENTS.md`, the project contract for mapping Figma components to reusable code components.

> **What changed in V2**
> - **shadcn/ui detection**: scan for `components.json` and shadcn-style `components/ui` files, and record their origin.
> - **Origin & custom tracking**: distinguish `shadcn`, `shadcn (customized)`, and `custom` components, and flag customized shadcn as "do not regenerate".
> - **shadcn Figma Kit naming**: align Figma variant/size names with the shadcn props API.
>
> Everything else is identical to the original `components` skill.

Keep responsibilities separate:

- `design-md` skill: produces design token artifacts (`DESIGN.md`, tokens, CSS) when the design system changes.
- `components` skill: creates or updates `COMPONENTS.md` when components are added or modified.

## When to Run

Run this skill when:

- A designer adds a new Figma component and publishes it to the library.
- An existing component's variant or property changes.
- A new code component has been implemented and its path must be registered in `COMPONENTS.md`.
- A shadcn/ui component has been installed (`npx shadcn add <name>`) and must be registered.
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
1. COMPONENTS.md mapped Code Path
2. components/ui
3. components/sections
4. route-local components
5. new component — reason required

## Components
| Figma Name | Code Path | Origin | Variants/Notes |
|------------|-----------|--------|----------------|
| Button | components/ui/button.tsx | shadcn | variant=default/destructive/outline/ghost, size=sm/default/lg |
| PricingCard | components/sections/PricingCard.tsx | custom | variant=monthly/annual |

## Primitive Components
| Code Path | Origin | Role | Notes |
|-----------|--------|------|-------|
| components/ui/button.tsx | shadcn | button primitive | installable via `npx shadcn add button` |

## New Component Rule
New shared components are allowed only when existing components cannot express the required UI through props, variants, slots, or composition. Every new component must include the reason existing components are insufficient.
```

Rules for the `## Components` table:

- Use the columns `Figma Name`, `Code Path`, `Origin`, and `Variants/Notes`.
- The `Origin` column is a V2 addition. Use one of: `shadcn`, `shadcn (customized)`, or `custom`. If the original three-column format must be preserved, put the same origin/custom information at the start of `Variants/Notes` instead.
- Use the real project-relative code path when it is confirmed.
- Use `pending` in `Code Path` when the code component is not implemented or the path cannot be confirmed.
- Preserve existing entries unless the corresponding Figma component entry is being updated.

## shadcn/ui Handling (V2)

### Detection

Determine whether the project uses shadcn/ui before classifying components:

- A `components.json` file at the project root is the strongest signal (it is the shadcn CLI config).
- shadcn primitives live under `components/ui` as kebab-case files (`button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`) and typically use the `cn()` helper and `cva` variants.
- The designer may have built Figma frames from the official shadcn/ui Figma Kit. Kit components carry shadcn's standard names and variant/size props.

### Classifying origin

- **`shadcn`**: an unmodified shadcn primitive. Treat it as a project primitive. Note that it is installable/re-creatable via `npx shadcn add <name>`.
- **`shadcn (customized)`**: a shadcn primitive that has been edited (added variants, changed styling, extra props). This is the critical case:
  - Mark it `shadcn (customized)` and add **`do not regenerate`** to `Variants/Notes`. Re-running `npx shadcn add <name>` would overwrite the customization.
  - List the added or changed variants/props explicitly so implementers know the local API differs from upstream shadcn.
- **`custom`**: a component the team authored, unrelated to shadcn.

### shadcn that is not yet installed

If a Figma node maps to a standard shadcn component that is **not** present in the codebase:

- Do not invent a code path. Record the entry with `Code Path: pending` and `Origin: shadcn`, and note `install via npx shadcn add <name>`.
- Registering the actual path happens after `figma-implement` (V2) installs it, or after the developer installs it manually.

### Registering a freshly installed shadcn component

When the developer runs `npx shadcn add <name>`, this skill can pick it up:

- Scanning `components/ui` will surface the new file; add it to `## Primitive Components` with `Origin: shadcn`.
- To also fill the `## Components` Figma↔code mapping, run this skill with the matching Figma component URL so the Figma name and variants are linked. A pure code scan cannot know which Figma component the file corresponds to.

## Generation Workflow

1. Check whether `COMPONENTS.md` already exists.
2. Detect shadcn usage: look for `components.json` and shadcn-style files under `components/ui`.
3. Use Figma MCP to collect component structure, variants, and properties from the provided Figma URL.
4. If a codebase is available, scan the `components/` directory to confirm actual component paths and classify each as `shadcn`, `shadcn (customized)`, or `custom`.
5. If `COMPONENTS.md` does not exist, create it. If it exists, add or update only the matching component entries. Do not delete existing entries.
6. For shadcn components, set `Origin` and, when customized, add the `do not regenerate` flag plus the local variant/prop differences.
7. Report name alignment issues: when the Figma name and code component name differ, state the mapping clearly in `Variants/Notes`.

## Naming Alignment

Agents need consistent names to match Figma components to code components reliably.

- Figma component names should match code component names.
- When the designer uses the shadcn/ui Figma Kit, keep the Figma variant/size names aligned with the shadcn props API (e.g. `variant=default/destructive/outline/secondary/ghost/link`, `size=default/sm/lg/icon`). Record any divergence in `Variants/Notes`.
- If names differ, add a mapping note in the `Variants/Notes` column of `COMPONENTS.md`.
- When a mismatch is found, ask the designer to rename the Figma component or ask the developer to rename the code component.

## Quality Bar

- Every component in the Figma URL has a corresponding entry in `COMPONENTS.md`.
- Each entry records its origin (`shadcn`, `shadcn (customized)`, or `custom`).
- Customized shadcn components are flagged `do not regenerate` with their local variant/prop differences listed.
- No existing entries are deleted or overwritten unless the component itself was updated.
- Code paths use `pending` only when the component is genuinely not yet implemented (including standard shadcn components not yet installed).
