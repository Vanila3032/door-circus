const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Папка для сохранений
const DATA_FILE = path.join(__dirname, 'players.json');
let savedPlayers = {};

// Загружаем базу при старте
if (fs.existsSync(DATA_FILE)) {
    try {
        savedPlayers = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.log("Ошибка чтения файла сохранений, создаем новый.");
    }
}

// Функция сохранения базы
function saveDatabase() {
    fs.writeFile(DATA_FILE, JSON.stringify(savedPlayers, null, 2), (err) => {
        if (err) console.error("Ошибка сохранения базы:", err);
    });
}

const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    if (extname === '.js') contentType = 'text/javascript';
    else if (extname === '.css') contentType = 'text/css';
    else if (extname === '.png') contentType = 'image/png';
    else if (extname === '.jpg') contentType = 'image/jpeg';

    fs.readFile(filePath, (error, content) => {
        if (error) { 
            res.writeHead(404); 
            res.end('File not found'); 
        } else { 
            res.writeHead(200, { 'Content-Type': contentType }); 
            res.end(content, 'utf-8'); 
        }
    });
});

const wss = new WebSocket.Server({ server });
let players = {}; // Активные игроки в сети

wss.on('connection', (ws) => {
    let id = null;
    let currentNick = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'join') {
                currentNick = data.nick.toLowerCase();
                
                // ПРОВЕРКА ПАРОЛЯ
                if (savedPlayers[currentNick]) {
                    if (savedPlayers[currentNick].password !== data.password) {
                        ws.send(JSON.stringify({ type: 'authError', message: 'Неверный пароль!' }));
                        return;
                    }
                } else {
                    // Создаем нового игрока
                    savedPlayers[currentNick] = {
                        password: data.password,
                        appearance: data.appearance,
                        x: 500, y: 0, // Стартовая позиция
                        facing: 1
                    };
                    saveDatabase();
                }

                id = Math.random().toString(36).substr(2, 9);
                const saved = savedPlayers[currentNick];

                // Отправляем игроку его сохраненные данные
                players[id] = { 
                    id: id, 
                    nick: data.nick, 
                    x: saved.x, 
                    y: saved.y, 
                    facing: saved.facing, 
                    appearance: saved.appearance,
                    isSitting: false
                };
                
                ws.send(JSON.stringify({ type: 'authSuccess', player: players[id], others: Object.values(players).filter(p => p.id !== id) }));
                broadcast({ type: 'playerJoined', player: players[id] }, ws);
            }

            if (data.type === 'move' && id && players[id]) {
                players[id].x = data.x; 
                players[id].y = data.y; 
                players[id].facing = data.facing;
                players[id].isSitting = data.isSitting;
                
                // Обновляем позицию в базе
                if (savedPlayers[currentNick]) {
                    savedPlayers[currentNick].x = data.x;
                    savedPlayers[currentNick].y = data.y;
                    savedPlayers[currentNick].facing = data.facing;
                }
                
                broadcast({ type: 'playerMoved', id: id, x: data.x, y: data.y, facing: data.facing, isSitting: data.isSitting }, ws);
            }

            if (data.type === 'updateAppearance' && id && players[id]) {
                players[id].appearance = data.appearance;
                if (savedPlayers[currentNick]) {
                    savedPlayers[currentNick].appearance = data.appearance;
                    saveDatabase(); // Сохраняем скин
                }
                broadcast({ type: 'appearanceChanged', id: id, appearance: data.appearance }, ws);
            }

            if (data.type === 'chat' && id && players[id]) {
                broadcast({ type: 'chat', nick: players[id].nick, text: data.text }, null);
            }
        } catch (e) {
            console.error('Ошибка:', e);
        }
    });

    ws.on('close', () => {
        if (id && players[id]) {
            // Сохраняем позицию перед выходом
            if (savedPlayers[currentNick]) {
                savedPlayers[currentNick].x = players[id].x;
                savedPlayers[currentNick].y = players[id].y;
                savedPlayers[currentNick].facing = players[id].facing;
                saveDatabase();
            }
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

// Автосохранение раз в 10 секунд
setInterval(saveDatabase, 10000);

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}!`);
});
