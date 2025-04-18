import { deepEqual, equal } from 'node:assert';
import { it } from 'node:test';
import { mergeDB } from '../cli/helpers.js';
import i18n from '../index.js';
import db from './i18n.db.json' with { type: 'json' };

// Define db
i18n.db = db;

// Dummy data
const data = ['World', '🍦', '✌️'];

it('locale change', () => {
  i18n.locale = 'es';
  equal(i18n`Hello ${data[0]}!`, `Hola ${data[0]}!`);

  i18n.locale = 'de';
  equal(i18n`Hello ${data[0]}!`, `Hallo ${data[0]}!`);
});

it('nested tags', () => {
  const template = `Hello test ${data[0]}... ${i18n`${data[1]} - ${data[2]}... Such wow!`}`;
  equal(i18n`${template}`, template);
});

it('CLI mergeDB', () => {
  const data = {
    de: 'Hallo'.split(' '),
    es: 'Hola'.split(' '),
  };
  const existingDB = { token: { de: data.de } };
  const updatedDB = { token: { es: data.es } };
  const mergedDB = { token: { de: data.de, es: data.es } };
  deepEqual(mergeDB(existingDB, updatedDB), mergedDB);
  deepEqual(mergeDB({}, updatedDB), updatedDB);
});

// test.todo('traverseFile relative + absolute (NODE_PATH) imports')
// test.todo('traverseNode')
