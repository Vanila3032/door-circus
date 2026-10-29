const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Recto server OK');
});

const wss = new WebSocket.Server({ server });

const players = new Map(); // id -> { ws, nick, appearance, x, y, facing }
let nextId = 1;

wss.on('connection', (ws) => {
  const id = nextId++;
  let authed = false;

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === 'join') {
      authed = true;
      players.set(id, {
        ws, nick: data.nick,
        appearance: data.appearance || {},
        x: 500, y: 0, facing: 1
      });

      const others = [...players.entries()]
        .filter(([pid]) => pid !== id)
        .map(([pid, p]) => ({ id: pid, nick: p.nick, ...p.appearance, x: p.x, y: p.y, facing: p.facing }));

      ws.send(JSON.stringify({
        type: 'authSuccess',
        player: { id, nick: data.nick, appearance: data.appearance, x: 500, y: 0, facing: 1 },
        others,
        totalOnline: players.size
      }));

      broadcast({ type: 'playerJoined', player: { id, nick: data.nick, ...data.appearance, x: 500, y: 0, facing: 1 }, totalOnline: players.size }, id);
    }

    if (!authed) return;
    const p = players.get(id);
    if (!p) return;

    if (data.type === 'move') {
      p.x = data.x; p.y = data.y; p.facing = data.facing;
      broadcast({ type: 'playerMoved', id, x: data.x, y: data.y, facing: data.facing }, id);
    }

    if (data.type === 'updateAppearance') {
      p.appearance = { ...p.appearance, ...data.appearance };
      broadcast({ type: 'appearanceChanged', id, appearance: data.appearance }, id);
    }

    if (data.type === 'chat') {
      broadcast({ type: 'chat', nick: p.nick, text: data.text });
    }
  });

  ws.on('close', () => {
    const p = players.get(id);
    if (p) {
      players.delete(id);
      broadcast({ type: 'playerLeft', id, totalOnline: players.size });
    }
  });
});

function broadcast(msg, excludeId) {
  const str = JSON.stringify(msg);
  for (const [pid, p] of players) {
    if (pid !== excludeId && p.ws.readyState === WebSocket.OPEN) p.ws.send(str);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Recto server on ' + PORT));
