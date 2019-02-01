import test from 'ava';
import i18n from './index';
import db from './i18n.db.json';

// Define db
i18n.db = db;

// Dummy data
const data = [
  'World',
  '🍦',
  '✌️'
];

// TODO:
// cli test with empty db file
// cli test db merge

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
