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

app.get('/', (req, res) => {
  if (!req.query) {
    xkcdp.generate(pass_options, (err, pass) => {
      res.redirect(`/?id=${pass}`);
      res.end();
    });
  } else {
    res.sendFile(path.join(process.cwd(), 'dist/index.html'));
  }
});

app.use(express.static('./dist'));

const fs = require('fs');
const map_data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'map.json')));

app.ws('/ws/:id', (ws) => {
  ws.send(JSON.stringify({
    type: 'map',
    map: map_data,
  }));
});

app.listen(1233);
