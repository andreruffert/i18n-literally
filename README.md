# i18n-literally

> A simple way to introduce internationalization to your JS.

[![CI status](https://github.com/andreruffert/i18n-literally/workflows/CI/badge.svg)](https://github.com/andreruffert/i18n-literally/actions?workflow=CI)
[![npm version](https://img.shields.io/npm/v/i18n-literally.svg)](https://www.npmjs.com/package/i18n-literally)


## Install

```
$ npm install i18n-literally
```


## Usage

```js
import i18n from 'i18n-literally';
import db from './i18n.db.json';

// Set the database
i18n.db = db;

// 1. Write in the default language
i18n`Hello ${'World'}!`
// => Hello World!

// 2. Add/update your translations for a language
"$ npx i18n-literally index.js es"

// 3. Get translations based on locale
i18n.locale = 'es';
i18n`Hello ${'World'}!`
// => Hola World!
```

Write your entire application in the default language, and support multiple versions of the language by simply changing the `i18n.locale`. To Add/update translations simply run the [cli](#cli).


## API

### i18n\`template\`

Returns a string based on the locale (default "en").

### i18n.locale

Type: `string`
Default: `en`

### i18n.db

Type: `object`
Default: `{}`


## CLI

The cli helps you to easily maintain your translations in a simple web app.
All translations are stored in a [i18n.db.json](i18n.db.json) file.

```console
$ npx i18n-literally --help

  Usage:
    $ literally <cmd> <entry> <locale> [db]

  Arguments:
    <cmd>       Command defaults to "edit" (edit, check-missing-translations)
    <entry>     The entry file of your app
    <locale>    Locale to add/update translations for
    [db]        Database file defaults to "./i18n.db.json"

  Options:
    --root      Project's root directory (default: $PWD)
    --rootAlias Alias used by imports for project's root
    --help      Show information
    --version   Show current version

  Examples:
    $ literally edit ./index.js es
    $ literally edit ./src/index.js en --root=src --rootAlias=~
```

_The cli web app to add/update translations_.
![alt text](https://user-images.githubusercontent.com/464300/52097192-240d8c80-25ca-11e9-9a97-8a7d3b4626e0.png)


## Related

Inspired by this [post](https://codeburst.io/easy-i18n-in-10-lines-of-javascript-poc-eb9e5444d71e) from [Andrea Giammarchi](https://github.com/WebReflection).


## License

MIT © [André Ruffert](https://andreruffert.com)
