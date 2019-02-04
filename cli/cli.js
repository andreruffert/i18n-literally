#!/usr/bin/env node

const fs = require('fs');
const meow = require('meow');
const chalk = require('chalk');
const parser = require('@babel/parser');
const { collectImportsSync } = require('babel-collect-imports');
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

const { internal } = collectImportsSync(options.entry, { extensions: ['js']}, parserOptions);
const db = {
  old: JSON.parse(fs.readFileSync(options.db) || {}),
  new: {}
};

const findTaggedTemplateExpression = node => {
  switch (node.type) {
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
    default:
      for (let key in node) {
        if (typeof node[key] === 'object') {
          findTaggedTemplateExpression(node[key] || {});
        }
      }
  }
}

internal.filter(path => path.endsWith('.js')).forEach(file => {
  const code = fs.readFileSync(file).toString();
  const ast = parser.parse(code, parserOptions);
  ast.program.body.forEach(findTaggedTemplateExpression);
});

launchApp({ db, locale: options.locale, out: options.db });
