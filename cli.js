#!/usr/bin/env node

// TODO:
// - make sure to merge db
// - make sure db only includes strings used (only i18n tags)
// - ui to update db entries

const fs = require('fs');
const meow = require('meow');
const parser = require('@babel/parser');
const { collectImportsSync } = require('babel-collect-imports');

const cli = meow(`
	Usage
	  $ literally <entry> <locale> [db]
	Example
	  $ literally ./index.js es
    ...
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

const chunks = (chunk, i) => (i ? ('${' + (i - 1) + '}') : '') + chunk;
const { internal } = collectImportsSync(options.entry, { extensions: ['js']}, parserOptions);
const db = JSON.parse(fs.readFileSync(options.db) || {});

const findTaggedTemplateExpression = node => {
  switch (node.type) {
    case 'TaggedTemplateExpression':
      if (node.tag.name === 'i18n') {
        const strings = node.quasi.quasis.map(quasi => quasi.value.raw);
        const key = strings.join('\x01');
        const translation = db[key] && db[key][options.locale] || strings.slice();
        (db[key] = {})[options.locale] = translation;
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

// // TODO: HTML output
// Object.keys(db).forEach(key => {
//
//   const defaultSentence = key.split('\x01').map(chunks).join('');
//   const localeSentence = db[key][options.locale].map(chunks).join('');
//
//   console.log(`
//     en: ${defaultSentence}
//     de: ${localeSentence}
//   `);
//
//   // console.log(localeSentence.split(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g));
// })

console.log(db);

fs.writeFile('i18n.db.json', JSON.stringify(db, null, 2), (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
