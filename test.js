import test from 'ava';
import i18n from './index';
import db from './i18n.db.json';

// Define db
i18n.db = db;

// Dummy data
const data1 = 'expression1';
const data2 = 'expression2';

test('locale', t => {
  i18n.locale = 'es';
	t.is(i18n`Hello ${data1}!`, `Hola ${data1}!`);
});

test('nested tags', t => {
  const template = `Nested tags ${data1}... ${i18n`nested(${data1})`}, ${data2}`;
	t.is(i18n`${template}`, template);
});
