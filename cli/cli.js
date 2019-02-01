#!/usr/bin/env node

const fs = require('fs');
const meow = require('meow');
const parser = require('@babel/parser');
const { collectImportsSync } = require('babel-collect-imports');
const launchApp = require('./app');

const cli = meow(`
  Usage:
    $ literally <entry> <locale> [db]

  Arguments:
    <entry>     The entry file of your app
    <locale>    Locale to add/update translations for
    [db]        Database file defaults to "./i18n.db.json"

  Options:
    --help      Show information
    --version   Show current version

  Example:
    $ literally ./index.js es
`);

const options = {
  entry: cli.input[0],                    // entry file
  locale: cli.input[1],                   // locale to translate to
  db: cli.input[2] || './i18n.db.json'    // db file
};

if (!options.entry) {
	console.error('Specify a entry file');
	process.exit(1);
}

if (!options.locale) {
	console.error('Specify a locale');
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
        (db.new[key] = {})[options.locale] = translation;
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
