function i18n(strings, ...values) {
  const key = strings.join('\x01');
  const translation = (i18n.db[key] && i18n.db[key][i18n.locale]) || strings;
  return translation.map((string, idx) => [string, values[idx]])
    .reduce((acc, val) => acc.concat(val), [])
    .join('');

};

// Defaults
i18n.locale = 'en';
i18n.db = {};

module.exports = i18n;
