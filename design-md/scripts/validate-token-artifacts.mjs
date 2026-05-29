#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function usage() {
  console.log(`Usage: node scripts/validate-token-artifacts.mjs [options]

Validates DESIGN.md companion token artifacts.

Options:
  --design <path>          DESIGN.md path. Default: DESIGN.md
  --tailwind <path>        Tailwind artifact path. Default: tailwind.theme.css
  --tailwind-format <fmt>  Tailwind artifact format: css or json. Default: css
  --tokens-studio <path>   Tokens Studio token-set JSON artifact path. Default: tokens.studio.global.json
  --skip-tailwind-compare  Skip fresh @google/design.md export comparison.
  --help                  Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    design: 'DESIGN.md',
    tailwind: 'tailwind.theme.css',
    tailwindFormat: 'css',
    tokensStudio: 'tokens.studio.global.json',
    compareTailwind: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
    } else if (arg === '--skip-tailwind-compare') {
      options.compareTailwind = false;
    } else if (arg === '--design') {
      options.design = readValue(argv, ++index, arg);
    } else if (arg === '--tailwind') {
      options.tailwind = readValue(argv, ++index, arg);
    } else if (arg === '--tailwind-format') {
      options.tailwindFormat = readValue(argv, ++index, arg);
    } else if (arg === '--tokens-studio') {
      options.tokensStudio = readValue(argv, ++index, arg);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function validateArgs(options) {
  if (!['css', 'json'].includes(options.tailwindFormat)) {
    throw new Error('--tailwind-format must be "css" or "json"');
  }
}

function readValue(argv, index, arg) {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${arg} requires a value`);
  }
  return value;
}

async function readJson(pathLabel, filePath) {
  const resolvedPath = resolve(filePath);
  const raw = await readFile(resolvedPath, 'utf8');

  if (raw.trim().length === 0) {
    throw new Error(`${pathLabel} is empty: ${resolvedPath}`);
  }

  try {
    return {
      path: resolvedPath,
      value: JSON.parse(raw),
    };
  } catch (error) {
    throw new Error(`${pathLabel} is not valid JSON: ${resolvedPath}: ${error.message}`);
  }
}

async function readText(pathLabel, filePath) {
  const resolvedPath = resolve(filePath);
  const text = await readFile(resolvedPath, 'utf8');

  if (text.trim().length === 0) {
    throw new Error(`${pathLabel} is empty: ${resolvedPath}`);
  }

  return {
    path: resolvedPath,
    value: text,
  };
}

function sortForStableJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortForStableJson);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortForStableJson(nestedValue)]),
    );
  }

  return value;
}

function stableJson(value) {
  return JSON.stringify(sortForStableJson(value));
}

function assertTailwindJsonShape(value, failures) {
  const theme = value?.theme?.extend ?? value?.extend ?? value;
  const expectedKeys = [
    'colors',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'borderRadius',
    'spacing',
    'boxShadow',
  ];

  if (!theme || Array.isArray(theme) || typeof theme !== 'object') {
    failures.push('Tailwind artifact must be a JSON object.');
    return;
  }

  if (!expectedKeys.some((key) => Object.prototype.hasOwnProperty.call(theme, key))) {
    failures.push(
      `Tailwind artifact does not look like a theme.extend object; expected at least one of: ${expectedKeys.join(
        ', ',
      )}.`,
    );
  }
}

function normalizeCss(value) {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().replace(/\s+/g, ' ');
}

function assertTailwindCssShape(value, failures) {
  const namespacePattern =
    /--(?:color|font|text|leading|tracking|font-weight|radius|spacing|shadow|breakpoint|container)-[a-zA-Z0-9_-]+\s*:/;

  if (!/@theme\s*\{/.test(value)) {
    failures.push('Tailwind v4 CSS artifact must contain an @theme block.');
  }

  if (!namespacePattern.test(value)) {
    failures.push('Tailwind v4 CSS artifact must define at least one Tailwind theme variable namespace such as --color-*, --font-*, --text-*, --radius-*, or --spacing-*.');
  }
}

async function assertTailwindMatchesExport(designPath, tailwindValue, tailwindFormat, failures) {
  try {
    const exportFormat = tailwindFormat === 'css' ? 'css-tailwind' : 'json-tailwind';
    const { stdout } = await execFileAsync(
      'npx',
      ['@google/design.md', 'export', '--format', exportFormat, resolve(designPath)],
      {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 120000,
      },
    );

    if (tailwindFormat === 'css') {
      if (normalizeCss(stdout) !== normalizeCss(tailwindValue)) {
        failures.push('Tailwind CSS artifact does not match a fresh css-tailwind export.');
      }
      return;
    }

    const exported = JSON.parse(stdout);
    if (stableJson(exported) !== stableJson(tailwindValue)) {
      failures.push('Tailwind JSON artifact does not match a fresh json-tailwind export.');
    }
  } catch (error) {
    failures.push(`Could not compare Tailwind artifact with fresh export: ${error.message}`);
  }
}

function collectTokenLeaves(node, pathParts = [], leaves = []) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return leaves;
  }

  const isDtcg = Object.prototype.hasOwnProperty.call(node, '$value');
  const isLegacy = Object.prototype.hasOwnProperty.call(node, 'value');
  const hasType = Object.prototype.hasOwnProperty.call(node, '$type')
    || Object.prototype.hasOwnProperty.call(node, 'type');

  if ((isDtcg || isLegacy) && hasType) {
    leaves.push({
      path: pathParts.join('.'),
      format: isDtcg ? 'dtcg' : 'legacy',
      value: isDtcg ? node.$value : node.value,
    });
    return leaves;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) {
      continue;
    }
    collectTokenLeaves(value, [...pathParts, key], leaves);
  }

  return leaves;
}

function collectReferences(value, references = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\{([^}]+)\}/g)) {
      references.push(match[1]);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectReferences(item, references);
    }
  } else if (value && typeof value === 'object') {
    for (const nestedValue of Object.values(value)) {
      collectReferences(nestedValue, references);
    }
  }

  return references;
}

function assertTokensStudioShape(value, failures) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    failures.push('Tokens Studio artifact must be a JSON object.');
    return;
  }

  const topLevelKeys = Object.keys(value);
  const forbiddenTopLevelKeys = topLevelKeys.filter((key) => key.startsWith('$') || key === 'global');

  if (forbiddenTopLevelKeys.length > 0) {
    failures.push(
      `Tokens Studio token-set JSON must not include project wrapper key(s): ${forbiddenTopLevelKeys.join(
        ', ',
      )}. Paste only the selected token set contents, with groups such as colors, typography, spacing, rounded, and components at the top level.`,
    );
  }

  const leaves = collectTokenLeaves(value);
  const formats = new Set(leaves.map((leaf) => leaf.format));

  if (leaves.length === 0) {
    failures.push('Tokens Studio artifact contains no token leaves.');
    return;
  }

  if (formats.size > 1) {
    failures.push('Tokens Studio artifact mixes W3C DTCG and legacy token formats.');
  }

  const tokenPaths = new Set();
  for (const leaf of leaves) {
    tokenPaths.add(leaf.path);
  }

  for (const leaf of leaves) {
    for (const reference of collectReferences(leaf.value)) {
      if (reference.startsWith('global.')) {
        failures.push(
          `Tokens Studio reference must be relative to the current token set, not prefixed with global: {${reference}} in ${leaf.path}`,
        );
        continue;
      }

      if (!tokenPaths.has(reference)) {
        failures.push(`Tokens Studio reference does not resolve: {${reference}} in ${leaf.path}`);
      }
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  validateArgs(options);

  if (options.help) {
    usage();
    return;
  }

  const failures = [];
  const tailwind = options.tailwindFormat === 'css'
    ? await readText('Tailwind CSS artifact', options.tailwind)
    : await readJson('Tailwind JSON artifact', options.tailwind);
  const tokensStudio = await readJson('Tokens Studio artifact', options.tokensStudio);

  if (options.tailwindFormat === 'css') {
    assertTailwindCssShape(tailwind.value, failures);
  } else {
    assertTailwindJsonShape(tailwind.value, failures);
  }
  assertTokensStudioShape(tokensStudio.value, failures);

  if (options.compareTailwind) {
    await assertTailwindMatchesExport(options.design, tailwind.value, options.tailwindFormat, failures);
  }

  if (failures.length > 0) {
    console.error('artifact validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('artifact validation: ok');
  console.log(`tailwind: ${tailwind.path}`);
  console.log(`tokens_studio: ${tokensStudio.path}`);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
