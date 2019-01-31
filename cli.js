#!/usr/bin/env node

// TODO:
// - make sure to merge db
// - make sure db only includes strings used (only i18n tags)
// - ui to update db entries

const fs = require('fs');
const parser = require('@babel/parser');
const { collectImportsSync } = require('babel-collect-imports');

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

const options = {
  locale: 'de',           // locale to translate to
  entry: './localized.js',    // entry file
  db: './i18n.db.json'    // db file
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

internal.forEach(file => {
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
