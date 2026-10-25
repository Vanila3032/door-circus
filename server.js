const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const SUPABASE_URL = 'https://hyutxzmomdppfiztwajl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_secret_XIM-_dWp5LWadVvYNgRQmQ_-HEYiZv1';

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/saveSkin') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                await fetchSupabase(`players?nick=eq.${data.nick.toLowerCase()}`, 'PATCH', { 
                    appearance: data.appearance 
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ЛОГИКА РАЗДАЧИ ФАЙЛОВ
    const urlPath = req.url.split('?')[0];
    // Если запрос на корень, отдаем index.html
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html'; // По умолчанию считаем, что это HTML
    
    if (extname === '.js') contentType = 'text/javascript';
    else if (extname === '.css') contentType = 'text/css';
    else if (extname === '.png') contentType = 'image/png';
    else if (extname === '.jpg') contentType = 'image/jpeg';

    fs.readFile(filePath, (error, content) => {
        if (error) { 
            res.writeHead(404); 
            res.end('File not found'); 
        } else { 
            // ВАЖНО: text/html заставит браузер отрисовать страницу
            res.writeHead(200, { 'Content-Type': contentType }); 
            res.end(content, 'utf-8'); 
        }
    });
});

const wss = new WebSocket.Server({ server });
let players = {};

async function fetchSupabase(endpoint, method = 'GET', body = null) {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return res.status === 204 ? null : await res.json();
}

wss.on('connection', (ws) => {
    let id = null;
    let currentNick = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'join') {
                currentNick = data.nick.toLowerCase();
                const users = await fetchSupabase(`players?nick=eq.${currentNick}`);
                
                if (users.length > 0) {
                    if (users[0].password !== data.password) {
                        ws.send(JSON.stringify({ type: 'authError', message: 'Неверный пароль!' }));
                        return;
                    }
                } else {
                    const newPlayer = {
                        nick: currentNick, password: data.password,
                        appearance: data.appearance, x: 500, y: 0, facing: 1, coins: 0
                    };
                    await fetchSupabase('players', 'POST', newPlayer);
                    users.push(newPlayer);
                }

                const saved = users[0];
                id = Math.random().toString(36).substr(2, 9);
                
                players[id] = { 
                    id: id, nick: data.nick, x: saved.x, y: saved.y, 
                    facing: saved.facing, appearance: saved.appearance, 
                    isSitting: false, coins: saved.coins 
                };
                
                ws.send(JSON.stringify({ type: 'authSuccess', player: players[id], others: Object.values(players).filter(p => p.id !== id) }));
                broadcast({ type: 'playerJoined', player: players[id] }, ws);
            }

            if (data.type === 'move' && id && players[id]) {
                players[id].x = data.x; players[id].y = data.y; players[id].facing = data.facing;
                fetchSupabase(`players?nick=eq.${currentNick}`, 'PATCH', { x: data.x, y: data.y, facing: data.facing }).catch(e => console.log(e));
                broadcast({ type: 'playerMoved', id: id, x: data.x, y: data.y, facing: data.facing, isSitting: data.isSitting }, ws);
            }

            if (data.type === 'updateAppearance' && id && players[id]) {
                players[id].appearance = data.appearance;
                fetchSupabase(`players?nick=eq.${currentNick}`, 'PATCH', { appearance: data.appearance }).catch(e => console.log(e));
                broadcast({ type: 'appearanceChanged', id: id, appearance: data.appearance }, ws);
            }

            if (data.type === 'chat' && id && players[id]) {
                broadcast({ type: 'chat', nick: players[id].nick, text: data.text }, null);
            }
        } catch (e) { console.error('Ошибка:', e); }
    });

    ws.on('close', () => {
        if (id && players[id]) {
            if (currentNick) {
                fetchSupabase(`players?nick=eq.${currentNick}`, 'PATCH', { 
                    x: players[id].x, y: players[id].y, facing: players[id].facing 
                }).catch(e => console.log(e));
            }
            broadcast({ type: 'playerLeft', id: id }, null);
            delete players[id];
        }
    });
});

function broadcast(data, excludeWs) {
    const msg = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== excludeWs) client.send(msg);
    });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => { console.log(`Server started on port ${PORT}!`); });
