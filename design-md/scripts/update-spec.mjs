#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_SOURCE =
  'https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md';
const DEFAULT_TARGET = fileURLToPath(
  new URL('../references/DESIGN_SPEC.md', import.meta.url),
);

function usage() {
  console.log(`Usage: node scripts/update-spec.mjs [options]

Updates the bundled DESIGN.md spec reference.

Options:
  --source <url-or-path>  Source spec URL or local file path.
  --target <path>         Target DESIGN_SPEC.md path.
  --check                 Report whether the target would change without writing.
  --help                  Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    source: DEFAULT_SOURCE,
    target: DEFAULT_TARGET,
    check: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
    } else if (arg === '--check') {
      options.check = true;
    } else if (arg === '--source') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      options.source = value;
    } else if (arg === '--target') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      options.target = value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizeSpec(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd() + '\n';
}

function validateSpec(text, source) {
  const requiredMarkers = [
    '# DESIGN.md Format',
    '# Design Tokens',
    '## Schema',
    '### Section Order',
    '## Components',
  ];

  const missingMarkers = requiredMarkers.filter((marker) => !text.includes(marker));

  if (missingMarkers.length > 0) {
    throw new Error(
      `Fetched spec from ${source} is missing required marker(s): ${missingMarkers.join(
        ', ',
      )}`,
    );
  }
}

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        accept: 'text/plain, text/markdown, */*',
        'user-agent': 'design-md-skill-updater',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  return readFile(resolve(source), 'utf8');
}

async function readExisting(target) {
  try {
    return await readFile(target, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writeAtomically(target, text) {
  const resolvedTarget = resolve(target);
  const targetDir = dirname(resolvedTarget);
  const tempPath = resolve(
    targetDir,
    `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.md`,
  );

  await mkdir(targetDir, { recursive: true });
  await writeFile(tempPath, text, 'utf8');
  await rename(tempPath, resolvedTarget);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    usage();
    return;
  }

  const target = resolve(options.target);
  const next = normalizeSpec(await readSource(options.source));
  validateSpec(next, options.source);

  const previousRaw = await readExisting(target);
  const previous = previousRaw == null ? null : normalizeSpec(previousRaw);
  const oldHash = previous == null ? null : sha256(previous);
  const newHash = sha256(next);

  console.log(`source: ${options.source}`);
  console.log(`target: ${target}`);
  console.log(`old_sha256: ${oldHash ?? 'missing'}`);
  console.log(`new_sha256: ${newHash}`);

  if (previous === next) {
    console.log('status: unchanged');
    return;
  }

  if (options.check) {
    console.log('status: would_update');
    return;
  }

  await writeAtomically(target, next);
  console.log('status: updated');
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
