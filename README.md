# i18n-literally

> A simple way to introduce `i18n` to your JS.

[![npm version](https://img.shields.io/npm/v/i18n-literally.svg)](https://www.npmjs.com/package/i18n-literally)

## Install

```
$ npm install i18n-literally
```


## Usage

```js
import i18n from 'i18n-literally';
import db from './i18n.db.json';

// Default locale
i18n.locale = 'en';

// Set a database
i18n.db = db;

// Write in the default language
i18n`Hello ${'World'}!`
// => Hello World!

// Switch to Spanish
i18n.locale = 'es';
i18n`Hello ${'World'}!`
// => Hola World!

i18n.locale = 'de';
i18n`Hello ${'World'}!`
// => Hallo World!
```


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
```

_The cli web app to add/update translations_.
![alt text](https://user-images.githubusercontent.com/464300/52097192-240d8c80-25ca-11e9-9a97-8a7d3b4626e0.png)


## Related

Inspired by this [post](https://codeburst.io/easy-i18n-in-10-lines-of-javascript-poc-eb9e5444d71e) from [Andrea Giammarchi](https://github.com/WebReflection).


## License

MIT © [André Ruffert](https://andreruffert.com)
