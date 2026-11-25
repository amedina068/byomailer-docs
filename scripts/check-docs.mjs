#!/usr/bin/env node
// Checks the Markdown pages of this repository.
//
// 1. Each page has front matter with `title`, `description` and `order`.
// 2. Each internal link resolves to a page, and each anchor to a heading.
// 3. Each `php artisan <command>` in a page exists in the app.
// 4. Each environment variable in the code of a page exists in the app.
// 5. Each endpoint on an API page (`GET /api/v1/...` and each curl URL) is
//    an operation in the OpenAPI spec of the app (`docs/api/openapi.yaml`),
//    and each operation of the spec is on an API page.
//
// Checks 3, 4 and 5 need the source of the app. Set BYOMAILER_APP_PATH to the
// app folder. If BYOMAILER_APP_PATH is not set, the script runs checks 1 and 2
// only. If the app has no `docs/api/openapi.yaml`, the script skips check 5. If the app folder has `vendor/`, the script reads the commands from
// `php artisan list`. If not, it reads the signatures in
// `app/Console/Commands` and a fixed list of framework commands.
//
// Usage: node scripts/check-docs.mjs [--links-only]
// No dependencies. Node 20 or later.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const linksOnly = process.argv.includes('--links-only');
const appPath = linksOnly ? null : process.env.BYOMAILER_APP_PATH || null;

// Folders that hold no published pages.
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts']);
// Files at the root that are not pages, so they need no front matter.
const NON_PAGES = new Set(['README.md', 'CONTRIBUTING.md']);

// Environment variables that the app does not read, but that a page names
// on purpose. Each entry says who reads it.
const EXTERNAL_ENV = new Map([
  ['BYOMAILER_APP_PATH', 'read by the scripts of this repository'],
  ['YOUR_API_TOKEN', 'the placeholder token of the Postman files of the app'],
  ['BYOMAILER_AUTH', 'read by mcp-remote in the Claude Desktop configuration'],
  ['BYOMAILER_URL', 'read by the SDKs and their Laravel and Rails integrations'],
  ['BYOMAILER_TOKEN', 'read by the SDKs and their Laravel and Rails integrations'],
  ['BYOMAILER_WEBHOOK_SECRET', 'read by the SDKs and their Laravel and Rails integrations'],
  ['BYOMAILER_TIMEOUT', 'read by the Laravel integration of the PHP SDK'],
  ['BYOMAILER_RETRIES', 'read by the Laravel integration of the PHP SDK'],
  ['BYOMAILER_WEBHOOK_TOLERANCE', 'read by the Laravel integration of the PHP SDK'],
]);

// Framework commands that the fallback mode accepts when `vendor/` is missing.
const FRAMEWORK_COMMANDS = [
  'about', 'config:cache', 'config:clear', 'db:seed', 'down', 'horizon',
  'horizon:terminate', 'horizon:status', 'key:generate', 'list', 'mcp:inspector', 'migrate',
  'migrate:fresh', 'migrate:status', 'optimize', 'optimize:clear',
  'queue:failed', 'queue:retry', 'queue:work', 'route:cache',
  'route:clear', 'route:list', 'schedule:list', 'schedule:run',
  'schedule:work', 'serve', 'storage:link', 'test', 'tinker', 'up',
  'view:cache', 'view:clear', 'vendor:publish', 'package:discover',
  'scramble:analyze', 'scramble:export', 'wayfinder:generate', 'inertia:start-ssr',
];

const errors = [];
const warnings = [];
const fail = (file, line, message) => errors.push(`${relative(root, file)}:${line}: ${message}`);

// ---------------------------------------------------------------------------
// Collect the pages
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    // A hidden folder holds no page. The CI clones the app into `.app`.
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith('.md')) out.push(path);
  }
  return out;
}

const files = walk(root).sort();
const sources = new Map(files.map((file) => [file, readFileSync(file, 'utf8')]));

// ---------------------------------------------------------------------------
// Helpers for Markdown
// ---------------------------------------------------------------------------

/** Splits a page into lines and marks the lines that are in a fenced code block. */
function lines(text) {
  let fence = null;
  return text.split('\n').map((line, index) => {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    let inCode = fence !== null;
    if (match) {
      if (fence === null) {
        fence = match[1];
        inCode = true;
      } else if (match[1][0] === fence[0] && match[1].length >= fence.length) {
        fence = null;
        inCode = true;
      }
    }
    return { number: index + 1, text: line, inCode };
  });
}

/** The heading slug that GitHub and most Markdown renderers make. */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*~[\]()]/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

const anchorCache = new Map();
function anchors(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const seen = new Map();
  const set = new Set();
  for (const line of lines(sources.get(file) ?? readFileSync(file, 'utf8'))) {
    if (line.inCode) continue;
    const match = line.text.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!match) continue;
    const base = slug(match[1]);
    const count = seen.get(base) ?? 0;
    set.add(count === 0 ? base : `${base}-${count}`);
    seen.set(base, count + 1);
  }
  anchorCache.set(file, set);
  return set;
}

/** Inline code spans of a line that is not in a code block. */
function inlineCode(text) {
  return [...text.matchAll(/(`+)(.+?)\1/g)].map((m) => m[2]);
}

// ---------------------------------------------------------------------------
// Check 1: front matter
// ---------------------------------------------------------------------------

for (const [file, text] of sources) {
  if (NON_PAGES.has(relative(root, file))) continue;
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(file, 1, 'front matter is missing');
    continue;
  }
  for (const field of ['title', 'description', 'order']) {
    if (!new RegExp(`^${field}:\\s*\\S`, 'm').test(match[1])) {
      fail(file, 1, `front matter has no "${field}"`);
    }
  }
  if (!/^order:\s*\d+\s*$/m.test(match[1])) fail(file, 1, '"order" is not an integer');
}

// ---------------------------------------------------------------------------
// Check 2: internal links and anchors
// ---------------------------------------------------------------------------

let linkCount = 0;
for (const [file, text] of sources) {
  for (const line of lines(text)) {
    if (line.inCode) continue;
    const withoutCode = line.text.replace(/(`+).+?\1/g, '');
    for (const match of withoutCode.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // http:, https:, mailto:
      linkCount++;
      const [pathPart, anchor] = target.split('#');
      const targetFile = pathPart === '' ? file : resolve(dirname(file), pathPart);
      if (!existsSync(targetFile)) {
        fail(file, line.number, `link target does not exist: ${target}`);
        continue;
      }
      if (statSync(targetFile).isDirectory()) {
        fail(file, line.number, `link points to a folder, not a page: ${target}`);
        continue;
      }
      if (anchor && targetFile.endsWith('.md') && !anchors(targetFile).has(anchor)) {
        fail(file, line.number, `anchor "#${anchor}" is not a heading in ${relative(root, targetFile)}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Checks 3 and 4: commands and environment variables
// ---------------------------------------------------------------------------

let commandCount = 0;
let envCount = 0;

if (appPath) {
  if (!existsSync(join(appPath, 'artisan'))) {
    console.error(`BYOMAILER_APP_PATH does not point to the app: ${appPath}`);
    process.exit(2);
  }

  const commands = loadCommands(appPath);
  const env = loadEnvKeys(appPath);

  for (const [file, text] of sources) {
    for (const line of lines(text)) {
      // Commands: anywhere in the page, in code or in prose.
      for (const match of line.text.matchAll(/php artisan ([a-z][a-z0-9:_-]*)/g)) {
        commandCount++;
        if (!commands.has(match[1])) {
          fail(file, line.number, `artisan command does not exist: ${match[1]}`);
        }
      }

      // Environment variables: only in code blocks and inline code.
      const chunks = line.inCode ? [line.text] : inlineCode(line.text);
      for (const chunk of chunks) {
        // A name before ".md" or another extension (`STYLE_GUIDE.md`) is a file name, not a variable.
        for (const match of chunk.matchAll(/(::|->|\\)?\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)(_\*)?(?!\.[A-Za-z]|[A-Z0-9_])/g)) {
          if (match[1]) continue; // a PHP constant or a class name, not a variable
          const name = match[2];
          // A name with no underscore (`TIMEOUT`, `HTTP`) is not a variable, except as a `NAME_*` prefix.
          if (!match[3] && !name.includes('_')) continue;
          envCount++;
          if (match[3]) {
            const prefix = `${name}_`;
            if (![...env].some((key) => key.startsWith(prefix))) {
              fail(file, line.number, `no environment variable starts with ${prefix}`);
            }
            continue;
          }
          if (!env.has(name) && !EXTERNAL_ENV.has(name)) {
            fail(file, line.number, `environment variable is not in the app: ${name}`);
          }
        }
      }
    }
  }
} else {
  warnings.push('BYOMAILER_APP_PATH is not set. The command and environment variable checks did not run.');
}

function loadCommands(app) {
  const names = new Set();
  if (existsSync(join(app, 'vendor', 'autoload.php'))) {
    try {
      const json = execFileSync('php', ['artisan', 'list', '--format=json', '--no-ansi'], {
        cwd: app,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      for (const command of JSON.parse(json).commands) names.add(command.name);
      return names;
    } catch (error) {
      warnings.push(`php artisan list failed, so the script used the fallback list: ${error.message.split('\n')[0]}`);
    }
  } else {
    warnings.push('The app has no vendor/ folder, so the script used the fallback command list.');
  }

  for (const name of FRAMEWORK_COMMANDS) names.add(name);
  const dir = join(app, 'app', 'Console', 'Commands');
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.php')) continue;
    const match = readFileSync(join(dir, file), 'utf8').match(/\$signature\s*=\s*'([^\s']+)/);
    if (match) names.add(match[1]);
  }
  return names;
}

function loadEnvKeys(app) {
  const keys = new Set();
  const add = (regex, text) => {
    for (const match of text.matchAll(regex)) keys.add(match[1]);
  };
  const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

  // KEY=value lines, also commented out ones.
  for (const name of ['.env.example']) {
    add(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/gm, read(join(app, name)));
  }

  // env('KEY') in config/.
  for (const file of listFiles(join(app, 'config'), '.php')) {
    add(/env\(\s*'([A-Z][A-Z0-9_]*)'/g, read(file));
  }

  // Docker and deploy files: KEY: value, KEY=value and ${KEY}.
  const dockerFiles = [
    join(app, 'docker-compose.yml'),
    join(app, 'docker-compose.image.yml'),
    join(app, 'Dockerfile'),
    ...listFiles(join(app, 'deploy')),
  ];
  for (const file of dockerFiles) {
    const text = read(file);
    add(/^\s*-?\s*([A-Z][A-Z0-9_]*)\s*[:=]/gm, text);
    add(/\$\{?([A-Z][A-Z0-9_]*)/g, text);
    add(/\b([A-Z][A-Z0-9_]*)=/g, text);
  }

  // Variables that the tests and the CI of the app read.
  for (const file of listFiles(join(app, 'tests'))) {
    const text = read(file);
    add(/process\.env\.([A-Z][A-Z0-9_]*)/g, text);
    // The k6 load tests in tests/load read __ENV.NAME.
    add(/__ENV\.([A-Z][A-Z0-9_]*)/g, text);
    add(/getenv\(\s*'([A-Z][A-Z0-9_]*)'/g, text);
    add(/env\(\s*'([A-Z][A-Z0-9_]*)'/g, text);
  }
  for (const file of listFiles(join(app, '.github', 'workflows'))) {
    add(/^\s*([A-Z][A-Z0-9_]*)\s*:/gm, read(file));
  }

  // env('KEY') in app/ and bootstrap/, if a class reads one directly.
  for (const dir of ['app', 'bootstrap']) {
    for (const file of listFiles(join(app, dir), '.php')) add(/env\(\s*'([A-Z][A-Z0-9_]*)'/g, read(file));
  }
  return keys;
}

function listFiles(dir, extension = '') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'vendor') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listFiles(path, extension));
    else if (name.endsWith(extension)) out.push(path);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Check 5: API endpoints against the OpenAPI spec
// ---------------------------------------------------------------------------

const API_PREFIX = '/api/v1';
let endpointCount = 0;
let operationCount = 0;

if (appPath) {
  const specFile = join(appPath, 'docs', 'api', 'openapi.yaml');
  if (existsSync(specFile)) {
    const operations = loadOperations(readFileSync(specFile, 'utf8'));
    const specPaths = [...new Set([...operations.keys()].map((key) => key.split(' ')[1]))];
    const documented = new Set();
    operationCount = operations.size;

    for (const [file, text] of sources) {
      if (!relative(root, file).startsWith(`api${'/'}`)) continue;
      for (const line of lines(text)) {
        // `GET /api/v1/contacts/{contactId}`: the method and the path must be an operation.
        for (const match of line.text.matchAll(/\b(GET|POST|PUT|PATCH|DELETE) (\/api\/v1\/[^\s`)|?]*)/g)) {
          endpointCount++;
          const path = match[2].slice(API_PREFIX.length).replace(/\/$/, '');
          const key = `${match[1].toLowerCase()} ${normalizePath(path)}`;
          if (!operations.has(key)) {
            fail(file, line.number, `endpoint is not in the OpenAPI spec: ${match[1]} ${match[2]}`);
          } else {
            documented.add(key);
          }
        }

        // A curl URL with real IDs: the path must match a path of the spec.
        for (const match of line.text.matchAll(/https:\/\/byomailer\.example(\/api\/v1\/[^\s"'?\\]*)/g)) {
          endpointCount++;
          const path = match[1].slice(API_PREFIX.length).replace(/\/$/, '');
          if (!specPaths.some((specPath) => pathPattern(specPath).test(path))) {
            fail(file, line.number, `URL path is not in the OpenAPI spec: ${match[1]}`);
          }
        }
      }
    }

    for (const [key, original] of operations) {
      if (!documented.has(key)) {
        errors.push(`api/: the OpenAPI operation ${original} is on no API page`);
      }
    }
  } else {
    warnings.push(`The app has no docs/api/openapi.yaml, so the endpoint check did not run.`);
  }
}

/**
 * Reads the operations of the `paths` section of the spec that Scramble
 * writes: a path key at two spaces and a method key at four spaces.
 * Returns a map from "method /path/{}" to "METHOD /api/v1/path/{name}".
 */
function loadOperations(yaml) {
  const operations = new Map();
  let inPaths = false;
  let path = null;
  for (const line of yaml.split('\n')) {
    if (/^\S/.test(line)) {
      inPaths = line.startsWith('paths:');
      continue;
    }
    if (!inPaths) continue;
    const pathMatch = line.match(/^  ['"]?(\/[^'":]*)['"]?:\s*$/);
    if (pathMatch) {
      path = pathMatch[1];
      continue;
    }
    const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/);
    if (methodMatch && path) {
      operations.set(`${methodMatch[1]} ${normalizePath(path)}`, `${methodMatch[1].toUpperCase()} ${API_PREFIX}${path}`);
    }
  }
  return operations;
}

/** Replaces each `{name}` path parameter with `{}`, so the names can differ. */
function normalizePath(path) {
  return path.replace(/\{[^}]+\}/g, '{}');
}

/** A regular expression that matches a spec path with real values in its parameters. */
function pathPattern(specPath) {
  const source = specPath
    .split(/(\{[^}]*\})/)
    .map((part) => (part.startsWith('{') ? '[^/]+' : part.replace(/[.*+?^$()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`^${source}$`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(error);

console.log(
  `Checked ${files.length} files: ${linkCount} internal links, ` +
    (appPath
      ? `${commandCount} artisan commands, ${envCount} environment variables, ${endpointCount} API endpoints against ${operationCount} OpenAPI operations.`
      : 'commands, variables and API endpoints skipped.'),
);

if (errors.length > 0) {
  console.error(`${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log('No problems found.');
