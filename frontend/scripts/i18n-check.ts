// Lists every English text the web app can show and checks that each language translates it.
//   npm run i18n:check -w frontend            report missing translations (exit 1 if any)
//   npm run i18n:check -w frontend -- --keys  print all keys as JSON
//   npm run i18n:check -w frontend -- --write <file>  save all keys as UTF-8 JSON
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { de } from '../src/i18n/locales/de';
import { el } from '../src/i18n/locales/el';
import { it } from '../src/i18n/locales/it';
import { sq } from '../src/i18n/locales/sq';

const root = resolve(import.meta.dirname, '..', '..');

const STRING = String.raw`('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\`(?:[^\`\\$]|\\.|\$(?!\{))*\`)`;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist') return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const unquote = (literal: string): string =>
  literal
    .slice(1, -1)
    .replace(/\\(['"`\\])/g, '$1')
    .replace(/\\n/g, '\n');

const collect = (
  files: string[],
  patterns: RegExp[],
  accept: (text: string) => boolean = () => true
): string[] =>
  files.flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    return patterns.flatMap((pattern) =>
      [...source.matchAll(pattern)]
        .map((match) => unquote(match[1]))
        .filter(accept)
    );
  });

const sourceFiles = (dir: string, skip: string[] = []): string[] =>
  walk(join(root, dir)).filter(
    (file) =>
      /\.(ts|tsx)$/.test(file) &&
      !/\.test\.tsx?$/.test(file) &&
      !skip.some((part) => relative(root, file).includes(part))
  );

// Texts marked in the web app: t('...'), msg('...') and the success text of a mutation.
const frontend = collect(
  sourceFiles(join('frontend', 'src'), [join('i18n', 'locales')]),
  [
    new RegExp(String.raw`(?<![\w.])(?:t|msg)\(\s*${STRING}`, 'g'),
    new RegExp(String.raw`success:\s*${STRING}`, 'g'),
  ]
);

// Validation messages of the shared schemas, shown through FormField.
const looksLikeMessage = (text: string): boolean =>
  /^[A-Z]/.test(text) && (text.includes(' ') || text.endsWith('.'));
const shared = collect(
  sourceFiles(join('shared', 'src', 'validation')),
  [new RegExp(String.raw`(?<!from\s)${STRING}`, 'g')],
  looksLikeMessage
);

// Messages the API throws on purpose; the web app translates them when it shows an error.
const backend = collect(sourceFiles(join('backend', 'src')), [
  new RegExp(
    String.raw`new (?:Validation|NotFound|Forbidden|Conflict|Unauthorized|App)Error\(\s*${STRING}`,
    'g'
  ),
  new RegExp(String.raw`message = ${STRING}`, 'g'),
]);

const keys = [...new Set([...frontend, ...shared, ...backend])]
  .filter((text) => text.trim() !== '')
  .sort();

if (process.argv.includes('--keys')) {
  console.log(JSON.stringify(keys, null, 2));
  process.exit(0);
}

const writeAt = process.argv.indexOf('--write');
if (writeAt !== -1) {
  writeFileSync(
    process.argv[writeAt + 1],
    `${JSON.stringify(keys, null, 2)}\n`,
    'utf8'
  );
  process.exit(0);
}

const placeholders = (text: string): string =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');

const languages: Record<string, Record<string, string>> = { sq, it, de, el };
let failed = false;

for (const [code, dictionary] of Object.entries(languages)) {
  const missing = keys.filter((key) => !dictionary[key]?.trim());
  const broken = keys.filter(
    (key) =>
      dictionary[key] && placeholders(key) !== placeholders(dictionary[key])
  );
  const unused = Object.keys(dictionary).filter((key) => !keys.includes(key));
  console.log(
    `${code}: ${keys.length - missing.length}/${keys.length} translated` +
      (unused.length > 0 ? `, ${unused.length} unused` : '')
  );
  for (const key of missing.slice(0, 20)) console.log(`  missing: ${key}`);
  if (missing.length > 20) console.log(`  ... and ${missing.length - 20} more`);
  for (const key of broken) console.log(`  placeholders differ: ${key}`);
  for (const key of unused.slice(0, 10)) console.log(`  unused: ${key}`);
  if (missing.length > 0 || broken.length > 0) failed = true;
}

if (failed) process.exit(1);
console.log(`All ${keys.length} texts are translated.`);
