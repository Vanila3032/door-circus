const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// 1. Создаем HTTP сервер для раздачи файлов игры
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    fs.readFile(filePath, (error, content) => {
        if (error) { 
            res.writeHead(404); 
            res.end('File not found'); 
        } else { 
            res.writeHead(200, { 'Content-Type': 'text/html' }); 
            res.end(content, 'utf-8'); 
        }
    });
});

// 2. Создаем WebSocket сервер для мультиплеера
const wss = new WebSocket.Server({ server });
let players = {};

wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substr(2, 9);
    console.log('Игрок подключился:', id);

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            players[id] = { id: id, nick: data.nick, x: 100, y: 0, facing: 1, appearance: data.appearance };
            ws.send(JSON.stringify({ type: 'currentPlayers', players: players }));
            broadcast({ type: 'playerJoined', player: players[id] }, ws);
        }

        if (data.type === 'move') {
            if (players[id]) {
                players[id].x = data.x; 
                players[id].y = data.y; 
                players[id].facing = data.facing;
                broadcast({ type: 'playerMoved', id: id, x: data.x, y: data.y, facing: data.facing }, ws);
            }
        }

        if (data.type === 'updateAppearance') {
            if (players[id]) {
                players[id].appearance = data.appearance;
                broadcast({ type: 'appearanceChanged', id: id, appearance: data.appearance }, ws);
            }
        }

        if (data.type === 'chat') {
            if (players[id]) {
                broadcast({ type: 'chat', nick: players[id].nick, text: data.text }, null);
            }
        }
    });

    ws.on('close', () => {
        console.log('Игрок отключился:', id);
        if (players[id]) {
            broadcast({ type: 'playerLeft', id: id }, null);
            delete players[id];
        }
    });
});

function broadcast(data, excludeWs) {
    const msg = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
            client.send(msg);
        }
    });
}

// 3. Запускаем сервер (Render автоматически подставит нужный порт)
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}!`);
});
