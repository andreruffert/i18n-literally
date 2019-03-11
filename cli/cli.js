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

const cli = meow(`
  Usage:
    $ ${CLI_NAME} <entry> <locale> [db]

  Arguments:
    <entry>     The entry file of your app
    <locale>    Locale to add/update translations for
    [db]        Database file defaults to "./i18n.db.json"

  Options:
    --help      Show information
    --version   Show current version

  Example:
    $ ${CLI_NAME} ./index.js es
`);

const flag = {
  error: msg => chalk.red(`\n${msg}\nTry \`${CLI_NAME} --help\` for more informations.\n`)
};

const options = {
  entry: cli.input[0],                    // entry file
  locale: cli.input[1],                   // locale to translate to
  db: cli.input[2] || './i18n.db.json'    // db file
};

if (!options.entry) {
  console.log(`${flag.error(`Missing <entry> argument.`)}`);
	process.exit(1);
}

if (!options.locale) {
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
  old: JSON.parse(fs.readFileSync(options.db) || {}),
  new: {}
};

function traverseFiles(file) {
  const code = fs.readFileSync(file).toString();
  const ast = parser.parse(code, parserOptions);
  const basePath = path.dirname(file);
  ast.program.body.forEach(node => traverseNode(node, basePath));
}

function traverseNode(node, basePath) {
  switch (node.type) {
    case 'ImportDeclaration':
      const isRelativePath = node.source.value.startsWith('.');
      const importPath = path.resolve(isRelativePath ? basePath : NODE_PATH, node.source.value);
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
        const translation = db.old[key] && db.old[key][options.locale] || strings.slice();
        // Skip empty strings & already existing keys
        if (!db.new[key] && translation.join('') !== '') {
          (db.new[key] = {})[options.locale] = translation;
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

traverseFiles(options.entry);
launchApp({ db, locale: options.locale, out: options.db });

console.log(`
  Indexed files: ${indexedFiles.length}
  Keys total: ${Object.keys(db.new).length}
`);
