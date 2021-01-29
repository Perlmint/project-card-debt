const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const xkcdp = new require('xkcd-password')();
const WebSocket = require('ws');
const url = require('url');
const random = require('lodash/random');

const pass_options = {
  numWords: 3,
  minLength: 4,
  maxLength: 8,
};

const games = new Map();

const wss = new WebSocket.Server({ server, path: '/game' });

app.get('/', async (req, res, next) => {
  if (!req.query.id) {
    const game_id = (await xkcdp.generate(pass_options)).join('-');
    if (!req.cookies?.['session']) {
      res.cookie('session', (await xkcdp.generate(pass_options)).join('-'));
    }
    res.redirect(`/?id=${game_id}`);
    games.set(game_id, new Map());
    res.end();
  } else {
    req.url = '/index.html';
    next('route');
  }
});

const fs = require('fs');
const map_data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'map.json')));

wss.on('connection', (ws, req) => {
  const req_url = url.parse(req.url, true);
  const { id: game_id, user } = req_url.query;
  /** @var {Map} */
  const game = games.get(game_id);
  if (!game) {
    return ws.close(4000, "not_found");
  }
  if (!user) {
    return ws.close(4002, "session_not_found");
  }

  const initial_pos = random(0, map_data.length - 1, false);
  game.set(user, [ws, initial_pos]);
  const user_data = game.get(user);

  ws.on('close', () => {
    game.delete(user);
    for (const [other,] of game) {
      other.close(4001, 'counterpart_close');
    }
  });
  ws.on('message', (data) => {
    data = JSON.parse(data);
    switch (data.type) {
      case 'arrival':
        user_data[1] = data.pos;
        break;
      case 'depature':
        user_data[1] = null;
        break;
    }
  });

  ws.send(JSON.stringify({
    type: 'init',
    map: map_data,
    pos: initial_pos,
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

server.listen(1234, '0.0.0.0');
