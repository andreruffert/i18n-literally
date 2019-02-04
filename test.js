import test from 'ava';
import i18n from './index';
import { mergeDB } from './cli/helpers';
import db from './i18n.db.json';

// Define db
i18n.db = db;

// Dummy data
const data = [
  'World',
  '🍦',
  '✌️'
];

test('locale change', t => {
  i18n.locale = 'es';
	t.is(i18n`Hello ${data[0]}!`, `Hola ${data[0]}!`);

  i18n.locale = 'de';
	t.is(i18n`Hello ${data[0]}!`, `Hallo ${data[0]}!`);
});

test('nested tags', t => {
  const template = `Hello test ${data[0]}... ${i18n`${data[1]} - ${data[2]}... Such wow!`}`;
	t.is(i18n`${template}`, template);
});

test('CLI mergeDB', t => {
  const data = {
    de: 'Hallo'.split(' '),
    es: 'Hola'.split(' ')
  };
  const existingDB = {'token': { 'de': data.de }};
  const updatedDB = {'token': { 'es': data.es }};
  const mergedDB = {'token': { de: data.de, es: data.es }};
	t.deepEqual(mergeDB(existingDB, updatedDB), mergedDB);
	t.deepEqual(mergeDB({}, updatedDB), updatedDB);
});
