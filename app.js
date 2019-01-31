const fs = require('fs');
const opn = require('opn');
const pkg = require('./package.json');

const chunkRegex = /\$\{[0-9]\}/g;
const chunks = (chunk, i) => (i ? ('${' + (i - 1) + '}') : '') + chunk;

const getRoute = (options, req, res) => {
  const routes = {
    '/': (req, res) => {
      const htmlFragments = Object.keys(options.db.new).map((key, idx) => {
        const defaultSentence = key.split('\x01').map(chunks).join('');
        const localizedSentence = options.db.new[key][options.locale].map(chunks).join('');
        return `
          <div>
            <b>en</b>
            <textarea readonly>${defaultSentence}</textarea>
          </div>
          <div>
            <label for="${key}">${options.locale}</label>
            <textarea name="${key}" id="${key}">${localizedSentence}</textarea>
          </div>
          <br />
          <br />
        `;
      });

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(`
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
          <head>
            <meta charset="utf-8">
            <title>${pkg.name}</title>
            <style>
              body {
                font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;
              }

              textarea {
                width: 100%;
              }
            </style>
            <script>
              const handleUpdate = e => {
                e.preventDefault();

                const data = [...e.target.elements]
                  .filter(element => element.nodeName === 'TEXTAREA')
                  .filter(element => !element.readOnly)
                  .reduce((obj, element) => {
                    obj[element.name] = {
                      ${options.locale}: element.value.split(${chunkRegex})
                    }
                    return obj;
                  }, {});

                fetch('/update', {
                  method: 'post',
                  body: JSON.stringify(data)
                });
              }
            </script>
          </head>
          <body>
            <form onsubmit="handleUpdate(event)">
              ${htmlFragments.join('')}
              <button type="submit">Update translations</button>
            </form>
          </body>
        </html>
      `);
    },
    '/update': (req, res) => {
      const body = [];
      const db = {};
      req.on('data', data => body.push(data));
      req.on('end', () => {
        const existingDB = options.db.old;
        const updatedDB = JSON.parse(body.join(''));
        const mergedDB = Object.keys(existingDB).reduce((obj, key) => {
          obj[key] = { ...existingDB[key], ...updatedDB[key]}
          return obj;
        }, {});

        fs.writeFile('i18n.db.json', `${JSON.stringify(mergedDB, null, 2)}\n`, (err) => {
          if (err) throw err;
          res.writeHead(200, 'OK');
          res.end();
        });
      });
    },
    'default': (req, res) => {
      res.writeHead(404, 'Not Found');
      res.end();
    }
  };
  return (routes[req.url] || routes['default'])(req, res);
};

function launchApp(options = {}, port = 8000) {
  const server = require('http').createServer((req, res) => getRoute(options, req, res));
  return server.listen(port, () => {
    const url = `http://localhost:${port}`;
    opn(url).then(() => console.log('Updating via ' + url));
  });
}

module.exports = launchApp;
