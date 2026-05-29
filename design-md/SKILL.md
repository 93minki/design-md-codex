---
name: design-md
description: Use when creating, updating, linting, exporting DESIGN.md, generating Tailwind design tokens or config artifacts, generating Tokens Studio JSON, or refreshing DESIGN_SPEC.md from Figma, design tokens, screenshots, UI references, brand guidelines, or existing interface styles.
---

# DESIGN.md Generator

Use this skill to create a valid `DESIGN.md` design-system document from Figma or other design evidence.

`DESIGN.md` is an alpha plain-text design-system format associated with `@google/design.md`. It combines optional YAML frontmatter for machine-readable tokens with a Markdown body for human-readable design rationale.

## Required Reference

Before writing or changing `DESIGN.md`, read `references/DESIGN_SPEC.md`. Treat it as the local source of truth for schema, section order, valid token shapes, and consumer behavior.

If the user asks to update, refresh, or sync the DESIGN.md spec reference, follow the Spec Update Workflow instead of generating a `DESIGN.md`.

## Inputs

Prefer direct design evidence over guesses:

- Figma frames, components, variables, styles, screenshots, and selected nodes
- Existing `DESIGN.md`, token JSON, Tailwind config, CSS variables, or brand guidelines
- Existing application UI if the user asks to derive the system from code

When the user asks to use Figma, use the available Figma connector/plugin workflow to inspect the relevant file, page, selection, frames, variables, styles, and components. If the Figma source is ambiguous, ask for the target file/frame/selection instead of inventing details.

## Output Rules

- Create or update `DESIGN.md` at the path requested by the user; otherwise use `DESIGN.md` in the current project root.
- When creating or materially updating `DESIGN.md`, also create or refresh the companion token artifacts unless the user explicitly opts out:
  - Tailwind artifact: default to Tailwind v4 CSS at `tailwind.theme.css` next to `DESIGN.md`, or use the user's requested path.
  - Tokens Studio artifact: default to `tokens.studio.global.json` next to `DESIGN.md`, or use the user's requested path.
- The YAML frontmatter must follow `references/DESIGN_SPEC.md`.
- The Markdown body must be written in Korean.
- Keep token names, CSS values, font names, component keys, brand names, and code identifiers in their natural spelling.
- Use the section order from the spec: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.
- Omit sections only when there is not enough evidence or the section is not relevant.
- Do not create duplicate `##` section headings.
- In `DESIGN.md`, the `## Components` section must contain only the Component Reuse Policy.
- Do not put code file paths or component tree details in `DESIGN.md`.
- Put the detailed component contract in `COMPONENTS.md`.
- Do not fabricate exact values when evidence exists. If evidence is incomplete, infer conservatively from the visible design and make the guidance practical.
- Do not overwrite an existing Tailwind config or Tokens Studio file blindly. Read existing files first, preserve project naming and format conventions, and report any incompatible merge instead of guessing.

## Handoff Outputs

Use handoff mode when the user provides a Figma URL and expresses or implies downstream implementation intent, such as preparing the design system for developers or implementing the Figma design in code.

In handoff mode, create or refresh the three default artifacts (`DESIGN.md`, `tailwind.theme.css`, and `tokens.studio.global.json`) plus:

- `COMPONENTS.md`: component reuse contract
- `code-connect.plan.md`: Figma-to-code component mapping plan

Place these handoff files next to `DESIGN.md` unless the user requests another path.

## COMPONENTS.md

Create `COMPONENTS.md` in handoff mode. It must include:

- `# Component Contract`
- `## Lookup Order`
  - Use this exact order: Code Connect mapping -> `components/ui` -> `components/sections` -> route-local -> new with reason.
- `## Primitive Components`
  - If a codebase exists, scan the `components/` directory and populate this section with actual project-relative paths.
  - If no codebase or no `components/` directory exists, use placeholders and ask the developer to review and replace them.
- `## New Component Rule`
  - New components are allowed only when the existing component inventory cannot express the required UI.
  - Every new component entry must include the reason existing components are insufficient.

Keep detailed component paths, reuse decisions, and component-tree notes in `COMPONENTS.md`, not in `DESIGN.md`.

## code-connect.plan.md

Create `code-connect.plan.md` in handoff mode. It must include:

- `## Required Figma Library Components`
- `## Mapping Candidates`
  - Include a table with these columns: `Figma Component | Code Component | Status`.
  - Initialize every `Status` value to `pending`.
- `## Designer Requirements`
- `## Developer Requirements`

If a Figma URL is available, extract the component list from Figma and use it to populate `Required Figma Library Components` and `Mapping Candidates`.

The developer owns the actual Code Connect setup. Do not claim Code Connect has been configured unless the user explicitly asks for that work and it has been verified.

## Companion Token Artifacts

Use the completed `DESIGN.md` YAML frontmatter as the single source of truth for all generated token artifacts.

### Tailwind

- Assume Tailwind CSS v4 by default.
- Prefer the official v4 CSS export command:

```bash
npx @google/design.md export --format css-tailwind DESIGN.md
```

- Save the export output to the Tailwind artifact path (`tailwind.theme.css` by default). This file should contain a Tailwind v4 `@theme { ... }` block with CSS variables such as `--color-*`, `--font-*`, `--text-*`, `--leading-*`, `--tracking-*`, `--font-weight-*`, `--radius-*`, and `--spacing-*`.
- Do not mutate `global.css`, `app.css`, or another Tailwind entry stylesheet unless the user asks for direct integration. If integrating, add or import the generated `@theme` block in the stylesheet that imports Tailwind, typically near `@import "tailwindcss";`.
- Only use the legacy v3 JSON export when the user explicitly asks for Tailwind v3, a `tailwind.config.*` integration, or a JSON theme artifact:

```bash
npx @google/design.md export --format json-tailwind DESIGN.md
```

- For legacy Tailwind v3 output, save the export to `design.tokens.tailwind.json` or the user's requested path. Do not mutate an existing `tailwind.config.*` unless the user asks for that integration.

### Tokens Studio

- Generate Tokens Studio JSON from the same YAML token groups, not from the prose.
- The default Tokens Studio artifact is the JSON View content for one token set, not a Sync Provider/GitHub/URL/remote-storage project export.
- Assume the token set name is `global`, but do not put that name in the JSON itself. Save the default token-set file as `tokens.studio.global.json`.
- The top-level JSON object must be the token set contents directly: `colors`, `typography`, `spacing`, `rounded`, `components`, or similar token groups.
- Do not add a top-level `$metadata`, `$themes`, `global`, or other project wrapper to `tokens.studio.global.json`.
- Prefer W3C DTCG format (`$type`, `$value`, optional `$description`) for new token-set files because Tokens Studio supports choosing W3C DTCG or legacy format. If an existing token-set JSON file is present, follow its current W3C/legacy format.
- Preserve DESIGN.md token paths where practical so references like `{colors.primary}` and `{spacing.md}` remain valid within the same token-set file.
- Do not write references with a token-set prefix such as `{global.colors.primary}`.
- Only create a full Tokens Studio project JSON such as `tokens.studio.json` when the user explicitly asks for Sync Provider, GitHub, URL, remote storage, multi-file export, or full project export.
- Map token groups conservatively:
  - `colors` -> `$type: "color"`
  - `typography` -> `$type: "typography"` with composite `$value`
  - `spacing` -> `$type: "spacing"` unless the project prefers DTCG-only `dimension`
  - `rounded` -> `$type: "borderRadius"` unless the project prefers DTCG-only `dimension`
  - `components` -> typed component sub-tokens when their type is clear; otherwise preserve them as `other` tokens or report why they were omitted.
- Validate generated JSON with `JSON.parse` before claiming it is ready to import.

## Artifact Verification

There is an official linter for `DESIGN.md`, but do not assume there is a single local lint command for every companion artifact.

- `DESIGN.md`: verify with `npx @google/design.md lint DESIGN.md`.
- Tailwind v4 CSS: verify it is non-empty CSS, contains an `@theme { ... }` block, declares Tailwind theme-variable namespaces, and matches a fresh `css-tailwind` export from the current `DESIGN.md`.
- Legacy Tailwind v3 JSON, only when explicitly requested: verify it parses as JSON, looks like a Tailwind `theme.extend` object, and matches a fresh `json-tailwind` export from the current `DESIGN.md`.
- Tokens Studio token-set JSON: verify it parses as JSON, has no top-level `$metadata`/`global` project wrapper, contains token leaves in either W3C DTCG (`$type`/`$value`) or legacy (`type`/`value`) format, does not mix formats accidentally, and has no unresolved or token-set-prefixed `{token.path}` references.

After writing companion artifacts, prefer the bundled validator:

```bash
node path/to/design-md/scripts/validate-token-artifacts.mjs \
  --design DESIGN.md \
  --tailwind tailwind.theme.css \
  --tokens-studio tokens.studio.global.json
```

For a user-requested Tailwind v3 JSON artifact, pass `--tailwind-format json`.

If the validator is unavailable, perform the same checks manually with Node: file exists and is non-empty, Tailwind v4 CSS contains a valid `@theme` block and matches a fresh `@google/design.md export --format css-tailwind`, legacy Tailwind JSON parses and matches `json-tailwind` when requested, and Tokens Studio token-set JSON has direct token groups at the top level with same-file references only.

## Generation Workflow

1. Read `references/DESIGN_SPEC.md`.
2. Collect design evidence from Figma or the source requested by the user.
3. Draft `DESIGN.md` with:
   - YAML frontmatter for tokens: `version`, `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, and `components` when supported by evidence.
   - Korean Markdown sections that explain how to apply the tokens.
4. Run:

```bash
npx @google/design.md lint DESIGN.md
```

5. If lint fails, fix `DESIGN.md` and rerun the lint command. Repeat until it passes or the remaining issue is blocked by missing source information.
6. After lint passes, generate the Tailwind v4 CSS artifact:

```bash
npx @google/design.md export --format css-tailwind DESIGN.md
```

7. Save the Tailwind export output to the requested path, or to `tailwind.theme.css` next to `DESIGN.md`.
8. Generate the Tokens Studio token-set artifact at the requested path, or at `tokens.studio.global.json` next to `DESIGN.md`, using the Companion Token Artifacts rules.
9. Run the Artifact Verification workflow. If validation fails, fix the artifact and rerun validation.
10. Report the paths created or updated. For Tokens Studio, tell the user: "In Tokens Studio, select the `global` token set, open JSON View, and paste the contents of `tokens.studio.global.json`." Mention any artifacts skipped because of missing token evidence or an explicit user opt-out.
11. In handoff mode, create or refresh `COMPONENTS.md` using the COMPONENTS.md rules.
12. In handoff mode, create or refresh `code-connect.plan.md` using the code-connect.plan.md rules.
13. In handoff mode, report all five artifact paths and include separate designer and developer action items.

## Spec Update Workflow

Use this workflow only when the user explicitly asks to update this skill's bundled spec reference, for example `$design-md update`, `refresh DESIGN_SPEC.md`, or `sync the DESIGN.md spec`.

1. Locate this skill directory and confirm `references/DESIGN_SPEC.md` exists.
2. From this skill directory, prefer the bundled updater:

```bash
node scripts/update-spec.mjs
```

3. The updater fetches the current official spec from `https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md` and atomically replaces `references/DESIGN_SPEC.md` when the content changed.
4. If the script cannot run, manually fetch the same official raw GitHub URL and write it to `references/DESIGN_SPEC.md`.
5. Do not rely on `npx @google/design.md spec` as the primary update path. The command has changed across package versions.
6. After updating, report whether the spec changed and include the old and new SHA-256 hashes if available.
7. If the skill directory is read-only, tell the user where the updated spec should be written or ask them to reinstall/update the skill package.

## Figma Extraction Checklist

Capture enough information to make the design system useful:

- Product or brand name, audience, tone, density, and design personality
- Color roles with hex values: primary, secondary, accent, neutral, surface, text, border, error, and state colors
- Typography roles: family, size, weight, line height, letter spacing, and where each role is used
- Spacing rhythm, layout grid, gutters, page margins, container widths, and responsive behavior
- Radius scale and shape language for buttons, cards, inputs, chips, and containers
- Elevation model: shadows, borders, tonal layering, overlays, and depth rules
- Component styling for buttons, inputs, cards, lists, chips, tabs, navigation, modals, and relevant domain components
- Practical Korean do/don't guidance for future agents building UI from the document

## Quality Bar

- Tokens are normative; prose explains how to use them.
- YAML values are valid and specific enough for automated export.
- Tailwind v4 CSS and Tokens Studio artifacts are generated from the same YAML token source as `DESIGN.md`.
- Tailwind CSS matches the current `css-tailwind` export, generated JSON artifacts parse successfully, and Tokens Studio token-set references resolve within the same file.
- Korean prose is concise, operational, and tied to visible design evidence.
- The file passes `@google/design.md` lint before export.
- Do not claim completion unless lint and artifact verification have passed, or clearly state why either could not be run.
