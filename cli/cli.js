#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const meow = require('meow');
const chalk = require('chalk');
const parser = require('@babel/parser');
const launchApp = require('./app');
const pkg = require('../package.json');

const CLI_NAME = Object.keys(pkg.bin)[0];
const CMDS = ['edit', 'check-missing-translations'];
const getCommand = cmd => CMDS.includes(cmd) ? cmd : CMDS[0];

const cli = meow(`
  Usage:
    $ ${CLI_NAME} <cmd> <entry> <locale> [db]

  Arguments:
    <cmd>       Command defaults to "${CMDS[0]}" (${CMDS.join(', ')})
    <entry>     The entry file of your app
    <locale>    Locale to add/update translations for
    [db]        Database file defaults to "./i18n.db.json"

  Options:
    --root      Project's root directory (default: $PWD)
    --rootAlias Alias used by imports for project's root
    --help      Show information
    --version   Show current version

  Example:
    $ ${CLI_NAME} edit ./index.js es
`);


const args = [...cli.input];
const flags = { ...cli.flags, root: cli.flags.root || process.env.PWD }

const flag = {
  error: msg => chalk.red(`\n${msg}\nTry \`${CLI_NAME} --help\` for more informations.\n`)
};

if (!CMDS.includes(args[0])) {
  args.unshift(CMDS[0]);
}

const options = {
  cmd: args[0],                     // command with default fallback
  entry: args[1],                   // entry file
  locale: args[2],                  // locale to translate to
  db: args[3] || './i18n.db.json'   // db file
};

if (!options.entry) {
  console.log(`${flag.error(`Missing <entry> argument.`)}`);
	process.exit(1);
}

if (options.cmd === CMDS[0] && !options.locale) {
  console.log(`${flag.error(`Missing <locale> argument.`)}`);
	process.exit(1);
}

const parserOptions = {
  // parse in strict mode and allow module declarations
  sourceType: 'module',
  plugins: [
    'estree',
    'jsx',

    // ECMAScript proposals
    'asyncGenerators',
    'bigInt',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'doExpressions',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'functionBind',
    'functionSent',
    'importMeta',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    'throwExpressions'
  ]
};

const NODE_PATH = process.env.NODE_PATH || '';
const fileCache = [];
const indexedFiles = [];
const db = {
  fileSystem: JSON.parse(fs.readFileSync(options.db) || {}),
  indexed: {}
};

traverseFiles(options.entry);

// Edit mode
if (options.cmd === CMDS[0]) {
  launchApp({ db, locale: options.locale, out: options.db });
}

// Check for missing translations
if (options.cmd === CMDS[1]) {
  if (hasMissingTranslations(db)) {
    console.log(`Missing translations\n`);
  	process.exit(1);
  }
}

console.log(`
  Indexed files: ${indexedFiles.length}
  Keys total: ${Object.keys(db.indexed).length}
  Translations: ${Object.keys(db.fileSystem).length}
  Removed: ${Object.keys(db.fileSystem).length - Object.keys(db.indexed).length}
  Missing: ${Object.keys(db.indexed).length - Object.keys(db.fileSystem).length}
`);



function traverseFiles(file) {
  const code = fs.readFileSync(file).toString();
  const ast = parser.parse(code, parserOptions);
  const basePath = path.dirname(file);
  ast.program.body.forEach(node => traverseNode(node, basePath));
}

function traverseNode(node, basePath) {
  switch (node.type) {
    case 'ImportDeclaration':
      let filePath = node.source.value;
      let dirPath = NODE_PATH;
      const isRelativePath = filePath.startsWith('.')
      if (flags.rootAlias && filePath.startsWith(flags.rootAlias)) {
        filePath = filePath.replace(new RegExp(`^${flags.rootAlias}\/?`), '');
        dirPath = flags.root;
      }
      if (isRelativePath) {
        dirPath = basePath;
      }
      const importPath = path.resolve(dirPath, filePath);

      if (!fileCache.includes(importPath)) {
        try {
          fileCache.push(importPath);
          traverseFiles(require.resolve(importPath));
          indexedFiles.push(importPath);
        } catch {}
      }
      break;
    case 'TaggedTemplateExpression':
      if (node.tag.name === 'i18n') {
        const strings = node.quasi.quasis.map(quasi => quasi.value.raw);
        const key = strings.join('\x01');
        const translation = db.fileSystem[key] && db.fileSystem[key][options.locale || 'default'] || strings.slice();
        // Skip empty strings & already existing keys
        if (!db.indexed[key] && translation.join('') !== '') {
          (db.indexed[key] = {})[options.locale || 'default'] = translation;
        }
      }
      break;
    default:
      for (let key in node) {
        if (typeof node[key] === 'object') {
          traverseNode((node[key] || {}), basePath);
        }
      }
  }
}

function hasMissingTranslations(db) {
  // Simply compare the indexed keys with the saved db keys.
  // TODO: check for missing language translations
  const totalIndexedDBKeys = Object.keys(db.indexed).length;
  const totalFileSystemDBKeys = Object.keys(db.fileSystem).length;
  return (totalIndexedDBKeys !== totalFileSystemDBKeys);
}
