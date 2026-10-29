const WebSocket = require('ws');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Ключи берутся из настроек Render (Environment Variables)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Recto server OK');
});

const wss = new WebSocket.Server({ server });
const players = new Map();
let nextId = 1;

wss.on('connection', (ws) => {
  const id = nextId++;
  let authed = false;

  ws.on('message', async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === 'join') {
      const nick = data.nick.trim();
      const password = data.password;

      // Ищем игрока в базе Supabase
      let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('nick', nick)
        .single();

      if (user) {
        // Если игрок есть, проверяем пароль
        if (user.password !== password) {
          ws.send(JSON.stringify({ type: 'authError', message: 'Неверный пароль' }));
          return;
        }
      } else {
        // Если игрока нет, регистрируем его
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ nick: nick, password: password, appearance: data.appearance }]);
        
        if (insertError) {
          ws.send(JSON.stringify({ type: 'authError', message: 'Ошибка базы данных' }));
          return;
        }
        user = { nick: nick, appearance: data.appearance };
      }

      authed = true;
      const savedAppearance = user.appearance || data.appearance;

      players.set(id, {
        ws, nick: nick,
        appearance: savedAppearance,
        x: 500, y: 0, facing: 1
      });

      const others = [...players.entries()]
        .filter(([pid]) => pid !== id)
        .map(([pid, p]) => ({ id: pid, nick: p.nick, ...p.appearance, x: p.x, y: p.y, facing: p.facing }));

      ws.send(JSON.stringify({
        type: 'authSuccess',
        player: { id, nick: nick, appearance: savedAppearance, x: 500, y: 0, facing: 1 },
        others,
        totalOnline: players.size
      }));

      broadcast({ type: 'playerJoined', player: { id, nick: nick, ...savedAppearance, x: 500, y: 0, facing: 1 }, totalOnline: players.size }, id);
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
      
      // Сохраняем новый скин в базу данных
      await supabase
        .from('users')
        .update({ appearance: p.appearance })
        .eq('nick', p.nick);
    }

    if (data.type === 'chat') {
      broadcast({ type: 'chat', nick: p.nick, text: data.text });
    }
  });

  ws.on('close', () => {
    if (players.has(id)) {
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
