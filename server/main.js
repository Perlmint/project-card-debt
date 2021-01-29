const express = require('express');
const path = require('path');

const app = express();
const exws = require('express-ws')(app);
const xkcdp = new require('xkcd-password')();

const pass_options = {
  numWords: 3,
  minLength: 4,
  maxLength: 8,
  separator: '-',
};

const games = new Map();

app.get('/', (req, res, next) => {
  if (!req.query) {
    xkcdp.generate(pass_options, (err, pass) => {
      res.redirect(`/?id=${pass}`);
      res.end();
    });
  } else {
    req.url = '/index.html';
    next('route');
  }
});

const fs = require('fs');
const map_data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'map.json')));

app.ws('/ws/:id', (ws) => {
  ws.send(JSON.stringify({
    type: 'map',
    map: map_data,
  }));
});


if (process.env.NODE_ENV !== 'production') {
  const parcel = require('parcel-bundler');
  const bundler = new parcel(
    path.join(process.cwd(), 'client/index.html'),
  );
  app.use(bundler.middleware());
} else {
  app.use(express.static('./dist'));
}

app.listen(1233);
