// Lists every English text the web and mobile apps can show and checks that each language translates it.
// The dictionaries live once in shared/src/i18n and are used by both apps.
//   npm run i18n:check -w frontend            report missing translations (exit 1 if any)
//   npm run i18n:check -w frontend -- --keys  print all keys as JSON
//   npm run i18n:check -w frontend -- --write <file>  save all keys as UTF-8 JSON
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { de } from '@gym/shared/i18n/de';
import { el } from '@gym/shared/i18n/el';
import { it } from '@gym/shared/i18n/it';
import { sq } from '@gym/shared/i18n/sq';

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
const marked = [
  new RegExp(String.raw`(?<![\w.])(?:t|msg)\(\s*${STRING}`, 'g'),
  new RegExp(String.raw`meta:\s*\{\s*success:\s*${STRING}`, 'g'),
];
const frontend = collect(sourceFiles(join('frontend', 'src')), marked);

// The mobile app marks its texts the same way.
const mobile = collect(sourceFiles(join('mobile', 'src')), marked);

// Validation messages of the shared schemas, shown through FormField.
const looksLikeMessage = (text: string): boolean =>
  /^[A-Z]/.test(text) &&
  !/^(GET|POST|PUT|PATCH|DELETE) \//.test(text) &&
  (text.includes(' ') || text.endsWith('.'));
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

const keys = [...new Set([...frontend, ...mobile, ...shared, ...backend])]
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
// `--all` lists every missing text instead of the first 20.
const shown = process.argv.includes('--all') ? Infinity : 20;
const languageNames: Record<string, string> = {
  sq: 'Albanian',
  it: 'Italian',
  de: 'German',
  el: 'Greek',
};

const quote = (text: string): string =>
  `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

// Rewrites each dictionary without the texts the app no longer uses (run prettier afterwards).
if (process.argv.includes('--prune')) {
  for (const [code, dictionary] of Object.entries(languages)) {
    const kept = Object.entries(dictionary).filter(([key]) =>
      keys.includes(key)
    );
    const body = kept
      .map(([key, value]) => `  ${quote(key)}: ${quote(value)},`)
      .join('\n');
    writeFileSync(
      join(root, 'shared', 'src', 'i18n', code, 'index.ts'),
      `// ${languageNames[code]}. Keys are the English texts used in the app; every key must be translated (npm run i18n:check).\nexport const ${code}: Record<string, string> = {\n${body}\n};\n`,
      'utf8'
    );
    console.log(
      `${code}: removed ${Object.keys(dictionary).length - kept.length} unused`
    );
  }
  process.exit(0);
}

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
  for (const key of missing.slice(0, shown)) console.log(`  missing: ${key}`);
  if (missing.length > shown)
    console.log(`  ... and ${missing.length - shown} more`);
  for (const key of broken) console.log(`  placeholders differ: ${key}`);
  for (const key of unused.slice(0, 10)) console.log(`  unused: ${key}`);
  if (missing.length > 0 || broken.length > 0) failed = true;
}

if (failed) process.exit(1);
console.log(`All ${keys.length} texts are translated.`);
