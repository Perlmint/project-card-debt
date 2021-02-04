const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const xkcdp = new require('xkcd-password')();
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const random = require('lodash/random');
const sample = require('lodash/sample');
const sampleSize = require('lodash/sampleSize');
const pick = require('lodash/pick');
const keys = require('lodash/keys');
const values = require('lodash/values');
const last = require('lodash/last');
const every = require('lodash/every');
const flatten = require('lodash/flatten');
const sortBy = require('lodash/sortBy');
const EventEmitter3 = require('eventemitter3');

const pass_options = {
  numWords: 3,
  minLength: 4,
  maxLength: 8,
};

const games = new Map();

const lobby_wss = new WebSocket.Server({ noServer: true });
const game_wss = new WebSocket.Server({ noServer: true });

app.get('/', async (req, res, next) => {
  if (!req.query.game_id) {
    req.url = '/lobby.html';
    next('route');
  } else {
    req.url = '/game.html';
    next('route');
  }
});

class Common extends EventEmitter3 {
  constructor() {
    super();
    this.counter = 0;
    this.targets = [];
    this.montage = {
      hair_color: null,
      hair_type: null,
      body_color: null,
      body_type: null,
      leg_color: null,
      leg_type: null,
    };
    this.car = [];
  }

  join() {
    this.counter++;
    if (this.counter == 2) {
      this.emit('start');
    } else if (this.counter > 2) {
      return true;
    }
    return false;
  }

  replayEvents(ws) {
    const events = [...this.targets, ...this.car];
    sortBy(events, v => -v.time);
    for (const target of events) {
      ws.send(JSON.stringify(target));
    }
  }
}

lobby_wss.on('connection', async (ws, req) => {
  const req_url = url.parse(req.url, true);
  let { game_id, user_name } = req_url.query;
  let game_data;
  if (!game_id) {
    game_id = (await xkcdp.generate(pass_options)).join('-');
    games.set(game_id, [{
      user_name,
      ws,
      role: 'lost',
    }, {
      user_name: null,
      ws: null,
      role: 'found',
    }]);

    ws.send(JSON.stringify({
      type: "game_id",
      game_id,
    }));
    game_data = games.get(game_id);
    ws.on('close', () => {
      let other_ws = game_data[0].ws;
      if (other_ws) {
        other_ws.close(4000, 'host_out');
      }
      if (!game_data[2]) {
        games.delete(game_id);
      }
    });
  } else {
    game_data = games.get(game_id);
    if (!game_data) {
      return ws.close(4002, 'game_not_found');
    }
    if (game_data[0].user_name === user_name) {
      return ws.close(4001, 'duplicated_name');
    }
    game_data[1].user_name = user_name;
    game_data[1].ws = ws;
    ws.on('close', () => {
      if (!game_data[2]) {
        game_data[1].data = game_data[1].ws = game_data[1].user_name = null;
        update();
      }
    });
  }

  const users = [game_data[0], game_data[1]];

  function update() {
    for (const user of users) {
      if (user.ws) {
        user.ws.send(JSON.stringify({
          type: 'update',
          data: users.map(o => pick(o, 'user_name', 'role'))
        }));
      }
    }
  }

  update();

  ws.on('message', (data) => {
    data = JSON.parse(data);
    switch (data.type) {
      case 'swap_role': {
        const r = game_data[0].role;
        game_data[0].role = game_data[1].role;
        game_data[1].role = r;
        update();
        break;
      }
      case 'start': {
        const [ws1, ws2] = [game_data[0].ws, game_data[1].ws];
        game_data[0].ws = game_data[1].ws = null;
        const map = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/map.json')));
        const common = new Common();
        common.map = map;
        game_data.push(common);
        const pos1 = random(0, map.nodes.length - 1, false);
        let pos2 = pos1;
        while (pos2 == pos1) {
          pos2 = random(0, map.nodes.length - 1, false);
        }
        game_data[0].data = {
          pos: pos1,
          role: game_data[0].role,
        };
        game_data[1].data = {
          pos: pos2,
          role: game_data[1].role,
        };
        const todo = sample(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/todo.json'))));
        if (game_data[0].role === 'found') {
          game_data[0].data.todo = todo;
          game_data[0].data.completed_targets = [];
        } else {
          game_data[1].data.todo = todo;
          game_data[1].data.completed_targets = [];
        }
        function createMontage() {
          const montage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/montage.json')));
          return {
            hair_color: Number.parseInt(sample(montage.hair_color)),
            hair_type: random(montage.hair_type - 1, false) + 1,
            body_color: Number.parseInt(sample(montage.body_color)),
            body_type: random(montage.body_type - 1, false) + 1,
            leg_color: Number.parseInt(sample(montage.leg_color)),
            leg_type: random(montage.leg_type - 1, false) + 1,
          };
        }
        game_data[0].data.montage = createMontage();
        game_data[1].data.montage = createMontage();

        ws1.close(4100, game_id);
        ws2.close(4100, game_id);
        break;
      }
    }
  });
})

game_wss.on('connection', (ws, req) => {
  const { game_id, user_name } = url.parse(req.url, true).query;
  /** @var {Map} */
  const game = games.get(game_id);
  if (!game) {
    return ws.close(4000, "not_found");
  }

  let user_data, other_user;
  if (game[0].user_name === user_name) {
    user_data = game[0];
    other_user = game[1];
  } else {
    user_data = game[1];
    other_user = game[0];
  }
  user_data.ws = ws;

  // ws.on('close', () => {
  //   other.close(4001, 'counterpart_close');
  // });
  ws.on('message', (data) => {
    parse_data = JSON.parse(data);
    function checkCapture() {
      console.log(other_user.data.pos, user_data.data.pos);
      if (other_user.data.pos === user_data.data.pos) {
        const has_montage = every(values(game[2].montage), (v) => v !== null);
        const last_target = last(game[2].targets);
        let while_action = false;
        if (last_target) {
          console.log(parse_data.time, last_target.time, last_target.post_delay * 1000 * 60);
          if (parse_data.time > last_target.time - last_target.post_delay * 1000 * 60) {
            while_action = true;
          }
        }

        if (has_montage || while_action) {
          if (user_data.role === 'found') {
            ws.send(JSON.stringify({
              type: 'win',
            }));
            other_user.ws?.send(JSON.stringify({
              type: 'defeat',
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'defeat',
            }));
            other_user.ws?.send(JSON.stringify({
              type: 'win',
            }));
          }
        }
      }
    }
    switch (parse_data.type) {
      case 'arrival':
        user_data.data.pos = parse_data.pos;
        checkCapture();
        break;
      case 'depature':
        user_data.data.pos = null;
        break;
      case 'ask': {
        const {node, time} = parse_data;
        for (const target of game[2].targets) {
          if (target.node === node && !target.got_montage) {
            target.got_montage = true;
            const dt = target.time - time;
            const parts = target.montage_init - Math.floor(dt / target.montage_decay / 1000)
            if (parts > 0) {
              const montage = pick(other_user.data.montage, sampleSize(keys(other_user.data.montage), parts));
              Object.assign(game[2].montage, montage);
              ws.send(JSON.stringify({
                type: 'montage',
                montage,
              }));
              break;
            }
          }
        }
        break;
      }
      case 'target_noti':
        game[2].targets.push(parse_data);
        user_data.data.completed_targets.push(...parse_data.targets);
        other_user.ws?.send(data);
        checkCapture();
        break;
      case 'tick_resp':
        other_user.ws?.send(JSON.stringify({
          type: 'tick_resp',
          time: parse_data.time,
        }));
        break;
      case 'car':
        game[2].car.push(parse_data);
        other_user.ws?.send(data);
        break;
      case 'end':
        if (user_data.role === 'found') {
          ws.send(JSON.stringify({
            type: 'defeat',
          }));
          other_user.ws?.send(JSON.stringify({
            type: 'win',
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'win',
          }));
          other_user.ws?.send(JSON.stringify({
            type: 'defeat',
          }));
        }
        break;
    }
  });
  ws.on('close', () => {
    user_data.ws = null;
    // if (other_user.ws == null) {
    //   games.delete(game_id);
    // }
  })

  function init() {
    ws.send(JSON.stringify({
      type: 'init',
      map: game[2].map,
      user_data: user_data.data,
    }));
  }

  game[2].on('start', init);
  if (game[2].join()) {
    init();
    if (user_data.data.role === 'lost') {
      game[2].replayEvents(ws);
      ws.send(JSON.stringify({
        type: 'montage',
        montage: game[2].montage,
      }));
    }
    other_user.ws?.send(JSON.stringify({
      type: 'tick_req',
    }));
  }
});

server.on('upgrade', (req, socket, head) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === '/game') {
    game_wss.handleUpgrade(req, socket, head, function done(ws) {
      game_wss.emit('connection', ws, req);
    });
  } else if (pathname === '/lobby') {
    lobby_wss.handleUpgrade(req, socket, head, function done(ws) {
      lobby_wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

if (process.env.NODE_ENV !== 'production') {
  const parcel = require('parcel-bundler');
  const bundler = new parcel(
    ['client/lobby.html', 'client/game.html'].map(p => path.join(process.cwd(), p)),
  );
  app.use(bundler.middleware());
} else {
  app.use(express.static('./dist'));
}

app.use('/data', express.static('./data'));

server.listen(1234, '0.0.0.0', () => {
  console.log('Open http://127.0.0.1:1234 on web browser');
});
