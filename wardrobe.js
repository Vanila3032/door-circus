// wardrobe.js

// Переменные для хранения ссылок на элементы интерфейса (создадим их при открытии)
let wardrobeContainer, optionsPanel, panelTitle, panelContent, colorPalette, previewCanvas, pCtx;
let currentWs, currentState;
let animId;

// Функция, которая вызывается из index.html при нажатии "Гардероб"
window.openWardrobe = function(ws, state) {
    currentWs = ws;
    currentState = state;

    // Если меню еще нет, создаем его
    if (!wardrobeContainer) {
        createWardrobeUI();
    }

    // Показываем меню
    wardrobeContainer.style.display = 'flex';
    
    // Синхронизируем наш локальный state с текущим скином игрока
    // (чтобы в гардеробе сразу отображался текущий скин)
    for (let key in currentState.player) {
        if (key !== 'x' && key !== 'y' && key !== 'vx' && key !== 'vy') {
             // копируем только визуальные данные
        }
    }
    
    // Запускаем отрисовку превью
    if (!animId) {
        loopPreview();
    }
    
    // Открываем первую вкладку
    openCategory('body');
};

function createWardrobeUI() {
    wardrobeContainer = document.getElementById('wardrobeContainer');
    // Делаем контейнер видимым и позиционируем поверх игры
    wardrobeContainer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(10,5,18,0.98); z-index:100; display:flex; flex-direction:column;';
    
    // Вставляем HTML интерфейса
    wardrobeContainer.innerHTML = `
        <style>
            .wardrobe-preview { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
            #previewCanvas { max-height: 70vh; width: auto; object-fit: contain; margin-top: -50px; }
            .color-palette { position: absolute; top: 20px; left: 0; right: 0; display: flex; justify-content: center; gap: 10px; z-index: 5; flex-wrap: wrap; }
            .color-btn { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; transition: transform 0.1s; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px; }
            .color-btn.active { transform: scale(1.2); border-color: #ff6ad5; box-shadow: 0 0 15px #ff6ad5; }
            .wardrobe-sidebar { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 10; overflow-y: auto; max-height: 80vh; }
            .cat-btn { width: 50px; height: 50px; border-radius: 12px; background: rgba(10, 5, 18, 0.8); border: 2px solid #4a3a70; color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
            .cat-btn.active { background: rgba(122, 60, 255, 0.9); border-color: #ff6ad5; box-shadow: 0 0 15px rgba(255, 106, 213, 0.5); }
            .options-panel { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 10, 25, 0.95); border-top: 2px solid #4a3a70; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.3s; z-index: 20; max-height: 50%; }
            .options-panel.open { transform: translateY(0); }
            .panel-header { padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2040; }
            .panel-title { font-weight: bold; color: #ff6ad5; font-size: 16px; text-transform: uppercase; }
            .close-panel { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
            .panel-content { padding: 15px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
            .opt-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; flex: 1; min-width: 120px; max-width: 200px; text-align: center; position: relative; }
            .opt-btn.active { background: #7a3cff; border-color: #ff6ad5; }
            .opt-btn.premium { border-color: #ffd700; }
            .opt-btn.premium::before { content: '⭐'; position: absolute; top: -8px; right: -8px; font-size: 16px; filter: drop-shadow(0 0 5px #ffd700); }
            .bottom-actions { position: absolute; bottom: 20px; left: 80px; right: 20px; display: flex; gap: 15px; z-index: 15; }
            .action-btn { flex: 1; padding: 15px; border: none; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; }
            #wearBtn { background: #3cff9c; color: #000; }
            #closeWardrobeBtn { background: rgba(255, 85, 102, 0.9); color: #fff; }
        </style>

        <div class="wardrobe-preview">
            <canvas id="previewCanvas" width="400" height="600"></canvas>
        </div>
        <div class="color-palette" id="colorPalette"></div>
        <div class="wardrobe-sidebar">
            <button class="cat-btn active" data-category="body">🧑</button>
            <button class="cat-btn" data-category="hair">💇</button>
            <button class="cat-btn" data-category="eyes">👁️</button>
            <button class="cat-btn" data-category="top">👕</button>
            <button class="cat-btn" data-category="bottom">👖</button>
            <button class="cat-btn" data-category="shoes">👟</button>
            <button class="cat-btn" data-category="hat">🧢</button>
            <button class="cat-btn" data-category="pet">🐾</button>
        </div>
        <div class="options-panel" id="optionsPanel">
            <div class="panel-header">
                <div class="panel-title" id="panelTitle">Тело</div>
                <button class="close-panel" id="closePanelBtn">✖</button>
            </div>
            <div class="panel-content" id="panelContent"></div>
        </div>
        <div class="bottom-actions">
            <button class="action-btn" id="closeWardrobeBtn">Отмена</button>
            <button class="action-btn" id="wearBtn">Надеть</button>
        </div>
    `;

    // Теперь получаем ссылки на элементы
    previewCanvas = document.getElementById('previewCanvas');
    pCtx = previewCanvas.getContext('2d');
    optionsPanel = document.getElementById('optionsPanel');
    panelTitle = document.getElementById('panelTitle');
    panelContent = document.getElementById('panelContent');
    colorPalette = document.getElementById('colorPalette');

    // Вешаем обработчики
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openCategory(e.currentTarget.dataset.category));
    });

    document.getElementById('closePanelBtn').addEventListener('click', () => {
        optionsPanel.classList.remove('open');
    });

    // КНОПКА "ОТМЕНА" (Закрывает гардероб, ничего не сохраняя)
    document.getElementById('closeWardrobeBtn').addEventListener('click', () => {
        wardrobeContainer.style.display = 'none';
        cancelAnimationFrame(animId);
        animId = null;
    });

    // КНОПКА "НАДЕТЬ" (Сохраняет скин через WebSocket)
    document.getElementById('wearBtn').addEventListener('click', () => {
        // Отправляем новый скин на сервер
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            currentWs.send(JSON.stringify({ 
                type: 'updateAppearance', 
                appearance: currentState.player 
            }));
        }
        
        // Закрываем гардероб
        wardrobeContainer.style.display = 'none';
        cancelAnimationFrame(animId);
        animId = null;
    });
}

// Данные для категорий
const categoriesData = {
  body: { 
    title: 'Тело', 
    colors: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4af37', '#a0522d', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00'],
    options: [{ label: 'Мужской', val: 'male' }, { label: 'Женский', val: 'female' }, { label: 'Слайм', val: 'slime', premium: true }], 
    stateKey: 'colorSkin', styleKey: 'gender' 
  },
  hair: { 
    title: 'Прическа', colors: ['#3a2050', '#000000', '#8b4513', '#ffd700', '#ff0000', '#ffffff', '#0000ff'], 
    options: [{ label: 'Обычные', val: 'straight' }, { label: 'Кудри', val: 'curly' }, { label: 'Коса', val: 'braid', premium: true }, { label: 'Лысый', val: 'bald' }], 
    stateKey: 'colorHair', styleKey: 'hairStyle' 
  },
  eyes: { 
    title: 'Глаза', 
    colors: ['#000000', '#0000ff', '#008000', '#8b4513', '#800080', '❤️'], 
    options: [], 
    stateKey: 'colorEyes', styleKey: 'eyeStyle' 
  },
  top: { 
    title: 'Верхняя одежда', colors: ['#ff6ad5', '#7a3cff', '#3cff9c', '#ffaa3c', '#ff3c5c', '#ffffff', '#1a1a1a', '#008080'], 
    options: [{ label: 'Футболка', val: 'tshirt' }, { label: 'Худи', val: 'hoodie' }, { label: 'Жилетка', val: 'vest' }, { label: 'Платье', val: 'dress' }, { label: 'Топик', val: 'tank_top', premium: true }], 
    stateKey: 'colorShirt', styleKey: 'topStyle' 
  },
  bottom: { 
    title: 'Штаны и Юбки', colors: ['#1a1a1a', '#4a3a70', '#2a1040', '#006400', '#8b4513', '#000080', '#808080', '#ff6ad5', '#ff0000'], 
    options: [{ label: 'Штаны', val: 'pants' }, { label: 'Шорты', val: 'shorts' }, { label: 'Юбка', val: 'skirt_short' }, { label: 'Юбка с колготками', val: 'skirt_tights', premium: true }], 
    stateKey: 'colorPants', styleKey: 'bottomStyle' 
  },
  shoes: { 
    title: 'Обувь', colors: ['#ffffff', '#ff0000', '#0000ff', '#ffaa00', '#006400', '#8b4513', '#3e2723', '#ff6ad5', '#ffd700'], 
    options: [{ label: 'Ботинки', val: 'boots' }, { label: 'Кроссовки', val: 'sneakers' }, { label: 'Каблуки', val: 'heels' }], 
    stateKey: 'colorShoes', styleKey: 'shoesStyle' 
  },
  hat: { 
    title: 'Головной убор', colors: ['#1a1a1a', '#ffffff', '#d4af37', '#ff6ad5', '#7a3cff', '#8b4513', '#ff0000'], 
    options: [{ label: 'Нет', val: 'none' }, { label: 'Кепка', val: 'cap' }, { label: 'Корона', val: 'crown' }, { label: 'Рожки', val: 'horns' }, { label: 'Маска', val: 'mask' }, { label: 'Шляпа ведьмы', val: 'witch_hat', premium: true }, { label: 'Франкенштейн', val: 'frankenstein', premium: true }, { label: 'Кошачьи ушки', val: 'cat_ears', premium: true }], 
    stateKey: 'hatColor', styleKey: 'hatType' 
  },
  pet: { 
    title: 'Питомцы', colors: null, 
    options: [{ label: 'Нет', val: 'none' }, { label: 'Летучая мышь', val: 'bat', premium: true }, { label: 'Черный кот', val: 'cat', premium: true }, { label: 'Тыковка', val: 'pumpkin', premium: true }], 
    stateKey: null, styleKey: 'petType' 
  }
};

let currentWardrobeCategory = 'body';

function openCategory(catKey) {
  currentWardrobeCategory = catKey;
  const data = categoriesData[catKey];
  
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.cat-btn[data-category="${catKey}"]`).classList.add('active');

  panelTitle.textContent = data.title;
  panelContent.innerHTML = '';

  if (data.options && data.options.length > 0) {
    data.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      
      if (currentState.player[data.styleKey] === opt.val) btn.classList.add('active');
      if (opt.premium) btn.classList.add('premium');
      
      btn.textContent = opt.label;
      btn.onclick = () => {
        currentState.player[data.styleKey] = opt.val;
        document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (opt.val === 'slime') {
          currentState.player.topStyle = 'none';
          currentState.player.bottomStyle = 'none';
          currentState.player.shoesStyle = 'none';
          currentState.player.hairStyle = 'bald';
        } else if (catKey === 'body' && opt.val !== 'slime') {
          currentState.player.topStyle = 'tshirt';
          currentState.player.bottomStyle = 'pants';
          currentState.player.shoesStyle = 'boots';
          currentState.player.hairStyle = 'straight';
        }
      };
      panelContent.appendChild(btn);
    });
  }

  colorPalette.innerHTML = '';
  if (data.colors) {
    data.colors.forEach(color => {
      const btn = document.createElement('div');
      btn.className = 'color-btn';
      
      if (color === '❤️') {
         btn.textContent = '❤️';
         btn.style.backgroundColor = '#333';
      } else {
         btn.style.backgroundColor = color;
      }
      
      if (currentState.player[data.stateKey] === color) btn.classList.add('active');
      btn.onclick = () => {
        currentState.player[data.stateKey] = color;
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      colorPalette.appendChild(btn);
    });
  }
  optionsPanel.classList.add('open');
}

// --- ОТРИСОВКА ПЕРСОНАЖА В ГАРДЕРОБЕ ---
function shadeColor(color, percent) {
    if(!color || color.length < 7) return '#000';
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);
    R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
    R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
    let rHex = R.toString(16); if(rHex.length==1) rHex="0"+rHex;
    let gHex = G.toString(16); if(gHex.length==1) gHex="0"+gHex;
    let bHex = B.toString(16); if(bHex.length==1) bHex="0"+bHex;
    return "#"+rHex+gHex+bHex;
}

let candyParticles = [];
let lastPumpkinSpawn = 0;
let previewTime = 0;
let isPreviewBlinking = false;

function loopPreview() {
    if (!wardrobeContainer || wardrobeContainer.style.display === 'none') return;
    
    previewTime++;
    if (previewTime % 200 === 0) isPreviewBlinking = true;
    if (previewTime % 200 === 15) isPreviewBlinking = false;
    
    updatePreviewParticles();
    drawPreviewCharacter();
    
    animId = requestAnimationFrame(loopPreview);
}

function updatePreviewParticles() {
  if (currentState.player.petType === 'pumpkin' && previewTime - lastPumpkinSpawn > 20) { 
    if (Math.random() < 0.8) { 
      candyParticles.push({
        x: previewCanvas.width / 2 + 100,
        y: previewCanvas.height - 90,
        vx: (Math.random() - 0.5) * 4,
        vy: -4 - Math.random() * 3,
        life: 1,
        color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]
      });
      lastPumpkinSpawn = previewTime;
    }
  }

  for (let i = candyParticles.length - 1; i >= 0; i--) {
    let p = candyParticles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.02;
    if (p.life <= 0) candyParticles.splice(i, 1);
  }
}

function drawPreviewCharacter() {
  const p = currentState.player;
  pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  pCtx.fillStyle = '#0a0512'; pCtx.fillRect(0, previewCanvas.height - 60, previewCanvas.width, 60);

  if (p.gender === 'slime') {
    drawPreviewSlime(p);
  } else {
    pCtx.save();
    const scale = 4.0; 
    const startX = (previewCanvas.width / 2) - (p.w * scale / 2);
    const startY = (previewCanvas.height - 60) - (p.h * scale);
    pCtx.translate(startX, startY); pCtx.scale(scale, scale);
    const breathe = Math.sin(previewTime * 0.05) * 1.5; pCtx.translate(0, breathe);

    const cSkin = p.colorSkin, cHair = p.colorHair, cEyes = p.colorEyes, cShirt = p.colorShirt, cPants = p.colorPants, hType = p.hatType, hColor = p.hatColor, isFemale = p.gender === 'female';
    const shoulderW = isFemale ? 14 : 16, armX_L = isFemale ? 2 : 0, armX_R = isFemale ? 18 : 20;

    pCtx.fillStyle = cSkin; pCtx.fillRect(5, 42, 6, 18); pCtx.fillRect(13, 42, 6, 18); pCtx.fillRect(armX_L, 24, 4, 15); pCtx.fillRect(armX_R, 24, 4, 15);

    if (p.topStyle !== 'dress') {
      if (p.bottomStyle === 'pants') { pCtx.fillStyle = cPants; pCtx.fillRect(5, 40, 6, 20); pCtx.fillRect(13, 40, 6, 20); } 
      else if (p.bottomStyle === 'shorts') { pCtx.fillStyle = cPants; pCtx.fillRect(5, 40, 6, 9); pCtx.fillRect(13, 40, 6, 9); } 
      else if (p.bottomStyle === 'skirt_short') { pCtx.fillStyle = cPants; pCtx.beginPath(); pCtx.moveTo(4, 40); pCtx.lineTo(20, 40); pCtx.lineTo(24, 48); pCtx.lineTo(0, 48); pCtx.fill(); } 
      else if (p.bottomStyle === 'skirt_tights') {
        pCtx.fillStyle = 'rgba(0, 0, 0, 0.8)'; pCtx.fillRect(5, 40, 6, 20); pCtx.fillRect(13, 40, 6, 20);
        pCtx.fillStyle = 'rgba(0, 0, 0, 1)'; for(let ty=41; ty<60; ty+=2) { pCtx.fillRect(6, ty, 1, 1); pCtx.fillRect(8, ty, 1, 1); pCtx.fillRect(10, ty, 1, 1); pCtx.fillRect(14, ty, 1, 1); pCtx.fillRect(16, ty, 1, 1); pCtx.fillRect(18, ty, 1, 1); }
        pCtx.fillStyle = cPants; pCtx.beginPath(); pCtx.moveTo(4, 40); pCtx.lineTo(20, 40); pCtx.lineTo(24, 48); pCtx.lineTo(0, 48); pCtx.fill(); 
      }
    }

    if (p.shoesStyle === 'boots') {
      pCtx.fillStyle = p.colorShoes; pCtx.fillRect(5, 54, 6, 6); pCtx.fillRect(13, 54, 6, 6); pCtx.fillStyle = shadeColor(p.colorShoes, -40); pCtx.fillRect(5, 57, 6, 3); pCtx.fillRect(13, 57, 6, 3);
    } else if (p.shoesStyle === 'sneakers') {
      pCtx.fillStyle = p.colorShoes; pCtx.fillRect(5, 54, 6, 4); pCtx.fillRect(13, 54, 6, 4); pCtx.fillStyle = '#fff'; pCtx.fillRect(5, 56, 6, 4); pCtx.fillRect(13, 56, 6, 4); pCtx.fillStyle = shadeColor(p.colorShoes, -30); pCtx.fillRect(6, 55, 4, 1); pCtx.fillRect(14, 55, 4, 1);
    } else if (p.shoesStyle === 'heels') {
      pCtx.fillStyle = p.colorShoes; pCtx.fillRect(5, 52, 6, 3); pCtx.fillRect(13, 52, 6, 3); pCtx.fillRect(6, 55, 4, 1); pCtx.fillRect(14, 55, 4, 1); pCtx.fillRect(7, 56, 1, 4); pCtx.fillRect(15, 56, 1, 4); 
    }

    const bodyX = isFemale ? 6 : 4; 
    pCtx.fillStyle = cSkin; pCtx.fillRect(bodyX, 24, shoulderW, 16);
    pCtx.fillStyle = 'rgba(0,0,0,0.15)';
    if (isFemale) { pCtx.fillRect(bodyX + 2, 24, shoulderW - 4, 2); pCtx.fillRect(bodyX + (shoulderW/2) - 1, 26, 2, 6); } else { pCtx.fillRect(bodyX + 2, 24, shoulderW - 4, 2); }
    pCtx.fillStyle = 'rgba(0,0,0,0.3)'; pCtx.fillRect(bodyX + (shoulderW/2) - 1, 36, 2, 2);

    pCtx.fillStyle = cShirt; 
    if (p.topStyle === 'tshirt') {
      pCtx.fillRect(bodyX, 24, shoulderW, 16); pCtx.fillRect(armX_L, 24, 4, 10); pCtx.fillRect(armX_R, 24, 4, 10); pCtx.fillStyle = 'rgba(0,0,0,0.2)'; pCtx.fillRect(bodyX + 3, 24, shoulderW - 6, 2);
    } else if (p.topStyle === 'vest') {
      pCtx.fillRect(bodyX, 24, shoulderW, 16); pCtx.fillStyle = '#fff'; pCtx.fillRect(bodyX + 6, 24, 4, 16); pCtx.fillStyle = 'rgba(0,0,0,0.2)'; pCtx.fillRect(bodyX + 3, 24, shoulderW - 6, 2);
    } else if (p.topStyle === 'hoodie') {
      pCtx.fillRect(bodyX, 24, shoulderW, 16); pCtx.fillStyle = cShirt; pCtx.fillRect(bodyX + 2, 22, shoulderW - 4, 4); pCtx.fillRect(armX_L, 24, 4, 14); pCtx.fillRect(armX_R, 24, 4, 14); pCtx.fillStyle = 'rgba(0,0,0,0.15)'; pCtx.fillRect(bodyX + 4, 32, shoulderW - 8, 6); pCtx.fillStyle = 'rgba(0,0,0,0.2)'; pCtx.fillRect(bodyX + 3, 24, shoulderW - 6, 2);
    } else if (p.topStyle === 'dress') {
      pCtx.fillRect(bodyX - 1, 24, shoulderW + 2, 14); pCtx.fillStyle = '#ff0000'; pCtx.fillRect(bodyX - 1, 36, shoulderW + 2, 2); pCtx.fillStyle = cShirt; pCtx.beginPath(); pCtx.moveTo(bodyX - 1, 38); pCtx.lineTo(bodyX + shoulderW + 1, 38); pCtx.lineTo(bodyX + shoulderW + 8, 55); pCtx.lineTo(bodyX - 8, 55); pCtx.fill(); pCtx.fillRect(armX_L, 24, 4, 8); pCtx.fillRect(armX_R, 24, 4, 8); 
    } else if (p.topStyle === 'tank_top') {
      pCtx.fillStyle = cShirt; pCtx.fillRect(bodyX, 27, shoulderW, 6); pCtx.fillRect(bodyX + 2, 24, 2, 3); pCtx.fillRect(bodyX + shoulderW - 4, 24, 2, 3);
    }

    pCtx.fillStyle = cSkin; pCtx.fillRect(3, 0, 18, 20);
    if (isFemale) { pCtx.fillStyle = 'rgba(255, 105, 180, 0.4)'; pCtx.fillRect(3, 12, 3, 3); pCtx.fillRect(18, 12, 3, 3); }
    pCtx.fillStyle = cSkin; pCtx.fillRect(1, 8, 2, 4); pCtx.fillRect(21, 8, 2, 4);
    
    if (hType !== 'mask' && hType !== 'frankenstein') {
      const eyeOffset = p.facing === 1 ? 2 : 0; 
      if (cEyes === '❤️') {
        pCtx.fillStyle = '#ff0000'; pCtx.fillRect(7 + eyeOffset, 7, 2, 2); pCtx.fillRect(10 + eyeOffset, 7, 2, 2); pCtx.fillRect(6 + eyeOffset, 9, 7, 2); pCtx.fillRect(7 + eyeOffset, 11, 5, 1); pCtx.fillRect(8 + eyeOffset, 12, 3, 1); pCtx.fillRect(9 + eyeOffset, 13, 1, 1); pCtx.fillRect(14 + eyeOffset, 7, 2, 2); pCtx.fillRect(17 + eyeOffset, 7, 2, 2); pCtx.fillRect(13 + eyeOffset, 9, 7, 2); pCtx.fillRect(14 + eyeOffset, 11, 5, 1); pCtx.fillRect(15 + eyeOffset, 12, 3, 1); pCtx.fillRect(16 + eyeOffset, 13, 1, 1);
      } else if (isPreviewBlinking) {
        pCtx.fillStyle = cSkin; pCtx.fillRect(6 + eyeOffset, 6, 5, 6); pCtx.fillRect(13 + eyeOffset, 6, 5, 6); pCtx.fillStyle = '#000'; pCtx.fillRect(6 + eyeOffset, 8, 5, 1); pCtx.fillRect(13 + eyeOffset, 8, 5, 1);
      } else {
        pCtx.fillStyle = '#fff'; pCtx.fillRect(6 + eyeOffset, 6, 5, 6); pCtx.fillRect(13 + eyeOffset, 6, 5, 6); pCtx.fillStyle = cEyes; pCtx.fillRect(8 + eyeOffset, 8, 2, 3); pCtx.fillRect(15 + eyeOffset, 8, 2, 3);
      }
      if (isFemale) { pCtx.fillStyle = '#000'; pCtx.fillRect(5 + eyeOffset, 5, 6, 1); pCtx.fillRect(12 + eyeOffset, 5, 6, 1); }
      pCtx.fillStyle = '#000'; pCtx.fillRect(9, 15, 6, 2);
    }

    if (p.hairStyle !== 'bald') {
      if (p.hairStyle === 'braid') {
        const hx = 19; const hairDark = shadeColor(cHair, -30); const hairLight = shadeColor(cHair, 30);
        pCtx.fillStyle = cHair; pCtx.fillRect(hx, 6, 6, 22); pCtx.fillStyle = hairDark; for(let i=0; i<6; i++) { pCtx.fillRect(hx, 8 + i*4, 6, 2); } pCtx.fillStyle = hairLight; for(let i=0; i<5; i++) { pCtx.fillRect(hx + 2, 10 + i*4, 2, 2); } pCtx.fillStyle = '#ff0000'; pCtx.fillRect(hx + 1, 28, 4, 2);
      } else {
        pCtx.fillStyle = cHair; if (isFemale) { pCtx.fillRect(1, 0, 22, 8); pCtx.fillRect(0, 8, 4, 14); pCtx.fillRect(20, 8, 4, 14); } else { pCtx.fillRect(2, 0, 20, 6); }
        if (p.hairStyle === 'curly') {
          const hairDark = shadeColor(cHair, -20); const hairLight = shadeColor(cHair, 20);
          pCtx.fillStyle = cHair; pCtx.beginPath(); pCtx.arc(4, 2, 3, 0, Math.PI*2); pCtx.arc(10, 1, 3, 0, Math.PI*2); pCtx.arc(16, 1, 3, 0, Math.PI*2); pCtx.arc(22, 2, 3, 0, Math.PI*2); pCtx.arc(2, 6, 2.5, 0, Math.PI*2); pCtx.arc(7, 5, 2.5, 0, Math.PI*2); pCtx.arc(13, 5, 2.5, 0, Math.PI*2); pCtx.arc(19, 5, 2.5, 0, Math.PI*2); if(isFemale) { pCtx.arc(1, 10, 2.5, 0, Math.PI*2); pCtx.arc(21, 10, 2.5, 0, Math.PI*2); } pCtx.fill();
          pCtx.fillStyle = hairLight; pCtx.beginPath(); pCtx.arc(6, 3, 1.5, 0, Math.PI*2); pCtx.arc(12, 2, 1.5, 0, Math.PI*2); pCtx.arc(18, 3, 1.5, 0, Math.PI*2); pCtx.fill();
          pCtx.fillStyle = hairDark; pCtx.beginPath(); pCtx.arc(3, 5, 1.5, 0, Math.PI*2); pCtx.arc(15, 4, 1.5, 0, Math.PI*2); pCtx.arc(21, 5, 1.5, 0, Math.PI*2); pCtx.fill();
        }
      }
    }

    if (hType === 'cap') { pCtx.fillStyle = hColor; pCtx.fillRect(2, -1, 20, 6); pCtx.fillRect(15, 2, 8, 3); pCtx.fillStyle = '#ffd700'; pCtx.fillRect(7, 1, 3, 2); pCtx.fillRect(12, 1, 3, 2); } 
    else if (hType === 'straw') { pCtx.fillStyle = hColor; pCtx.fillRect(-2, 2, 28, 4); pCtx.fillRect(5, -3, 14, 6); pCtx.fillStyle = '#ff0000'; pCtx.fillRect(5, 1, 14, 2); } 
    else if (hType === 'crown') { pCtx.fillStyle = hColor; pCtx.fillRect(4, -4, 16, 4); pCtx.beginPath(); pCtx.moveTo(4, -4); pCtx.lineTo(6, -10); pCtx.lineTo(9, -4); pCtx.lineTo(12, -11); pCtx.lineTo(15, -4); pCtx.lineTo(18, -10); pCtx.lineTo(20, -4); pCtx.fill(); pCtx.fillStyle = '#ff0000'; pCtx.fillRect(7, -2, 2, 2); pCtx.fillRect(11, -3, 2, 2); pCtx.fillRect(15, -2, 2, 2); } 
    else if (hType === 'witch_hat') {
      pCtx.fillStyle = '#1a1a1a'; pCtx.beginPath(); pCtx.ellipse(12, -1, 24, 5, 0, 0, Math.PI*2); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(2, -1); pCtx.lineTo(22, -1); pCtx.lineTo(16, -22); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(16, -22); pCtx.lineTo(26, -18); pCtx.lineTo(18, -15); pCtx.fill(); pCtx.fillStyle = 'rgba(255,255,255,0.1)'; pCtx.beginPath(); pCtx.moveTo(8, -1); pCtx.lineTo(12, -15); pCtx.lineTo(14, -15); pCtx.lineTo(10, -1); pCtx.fill(); pCtx.fillStyle = '#228b22'; pCtx.fillRect(4, -5, 16, 3); pCtx.fillStyle = '#ffd700'; pCtx.fillRect(10, -5, 4, 3);
    } 
    else if (hType === 'frankenstein') {
      pCtx.fillStyle = '#8b9a8b'; pCtx.fillRect(2, 2, 20, 18); pCtx.fillStyle = '#1a1a1a'; pCtx.fillRect(2, 0, 20, 4); pCtx.fillStyle = '#cccccc'; pCtx.fillRect(0, 10, 3, 4); pCtx.fillRect(21, 10, 3, 4); pCtx.fillStyle = '#000'; pCtx.fillRect(8, 16, 8, 1); pCtx.fillRect(12, 12, 1, 3); pCtx.fillStyle = '#ff0000'; pCtx.fillRect(6, 6, 4, 2); pCtx.fillRect(14, 6, 4, 2);
    } 
    else if (hType === 'cat_ears') {
      pCtx.fillStyle = hColor; pCtx.beginPath(); pCtx.moveTo(2, 0); pCtx.lineTo(6, -12); pCtx.lineTo(12, 0); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(12, 0); pCtx.lineTo(18, -12); pCtx.lineTo(22, 0); pCtx.fill(); pCtx.fillStyle = '#ffb6c1'; pCtx.beginPath(); pCtx.moveTo(5, -1); pCtx.lineTo(7, -8); pCtx.lineTo(10, -1); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(14, -1); pCtx.lineTo(17, -8); pCtx.lineTo(19, -1); pCtx.fill(); pCtx.strokeStyle = '#000'; pCtx.lineWidth = 1; pCtx.beginPath(); pCtx.moveTo(2, 14); pCtx.lineTo(-4, 12); pCtx.stroke(); pCtx.beginPath(); pCtx.moveTo(2, 16); pCtx.lineTo(-4, 16); pCtx.stroke(); pCtx.beginPath(); pCtx.moveTo(22, 14); pCtx.lineTo(28, 12); pCtx.stroke(); pCtx.beginPath(); pCtx.moveTo(22, 16); pCtx.lineTo(28, 16); pCtx.stroke();
    } 
    else if (hType === 'horns') { pCtx.fillStyle = hColor; pCtx.beginPath(); pCtx.moveTo(3, 2); pCtx.lineTo(1, -4); pCtx.lineTo(6, 0); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(21, 2); pCtx.lineTo(23, -4); pCtx.lineTo(18, 0); pCtx.fill(); } 
    else if (hType === 'mask') {
      pCtx.fillStyle = hColor; pCtx.beginPath(); pCtx.moveTo(2, 4); pCtx.lineTo(22, 4); pCtx.lineTo(20, 20); pCtx.lineTo(18, 22); pCtx.lineTo(6, 22); pCtx.lineTo(4, 20); pCtx.closePath(); pCtx.fill(); pCtx.fillStyle = '#ff0000'; pCtx.beginPath(); pCtx.moveTo(12, 4); pCtx.quadraticCurveTo(10, 10, 12, 16); pCtx.quadraticCurveTo(14, 10, 12, 4); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(6, 6); pCtx.lineTo(10, 12); pCtx.lineTo(8, 14); pCtx.lineTo(4, 8); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(18, 6); pCtx.lineTo(14, 12); pCtx.lineTo(16, 14); pCtx.lineTo(20, 8); pCtx.fill(); pCtx.fillStyle = '#ffffff'; pCtx.fillRect(4, 16, 16, 5); pCtx.fillStyle = '#000000'; for(let i=4; i<20; i+=3) { pCtx.fillRect(i, 16, 1, 5); }
    }

    pCtx.restore();
  }

  if (p.petType === 'bat') {
    const px = previewCanvas.width / 2 + Math.cos(previewTime * 0.05) * 80; const py = previewCanvas.height - 200 + Math.sin(previewTime * 0.05) * 30;
    pCtx.fillStyle = '#000'; pCtx.beginPath(); pCtx.arc(px, py, 10, 0, Math.PI*2); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(px, py); pCtx.lineTo(px - 20, py - 10); pCtx.lineTo(px - 25, py + 10); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(px, py); pCtx.lineTo(px + 20, py - 10); pCtx.lineTo(px + 25, py + 10); pCtx.fill();
  } else if (p.petType === 'cat') {
    const px = previewCanvas.width / 2 + 100; const py = previewCanvas.height - 60;
    pCtx.fillStyle = '#000'; pCtx.fillRect(px, py - 40, 35, 40); pCtx.beginPath(); pCtx.arc(px + 17, py - 45, 18, 0, Math.PI*2); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(px + 5, py - 60); pCtx.lineTo(px, py - 80); pCtx.lineTo(px + 20, py - 65); pCtx.fill(); pCtx.beginPath(); pCtx.moveTo(px + 30, py - 60); pCtx.lineTo(px + 35, py - 80); pCtx.lineTo(px + 15, py - 65); pCtx.fill(); pCtx.fillStyle = '#ff0'; pCtx.fillRect(px + 10, py - 48, 6, 6); pCtx.fillRect(px + 22, py - 48, 6, 6);
  } else if (p.petType === 'pumpkin') {
    const px = previewCanvas.width / 2 + 100; const py = previewCanvas.height - 60;
    pCtx.fillStyle = '#ff8c00'; pCtx.beginPath(); pCtx.ellipse(px + 15, py - 25, 20, 15, 0, 0, Math.PI*2); pCtx.fill(); pCtx.fillStyle = '#228b22'; pCtx.fillRect(px + 12, py - 42, 6, 6);
    if (isPreviewBlinking) { pCtx.fillStyle = '#000'; pCtx.fillRect(px + 5, py - 28, 6, 2); pCtx.fillRect(px + 18, py - 28, 6, 2); } else { pCtx.fillStyle = '#000'; pCtx.beginPath(); pCtx.arc(px + 8, py - 28, 3, 0, Math.PI*2); pCtx.arc(px + 21, py - 28, 3, 0, Math.PI*2); pCtx.fill(); pCtx.fillStyle = '#fff'; pCtx.fillRect(px + 7, py - 29, 1, 1); pCtx.fillRect(px + 20, py - 29, 1, 1); }
    pCtx.strokeStyle = '#000'; pCtx.lineWidth = 1.5; pCtx.beginPath(); pCtx.arc(px + 15, py - 20, 6, 0, Math.PI); pCtx.stroke();
  }

  for (let p of candyParticles) { pCtx.fillStyle = p.color; pCtx.globalAlpha = p.life; pCtx.fillRect(p.x, p.y, 4, 4); pCtx.globalAlpha = 1; }
}

function drawPreviewSlime(p) {
  const scale = 4.0; const cx = previewCanvas.width / 2; const cy = previewCanvas.height - 60;
  pCtx.save(); pCtx.translate(cx, cy); pCtx.scale(scale, scale);
  const vibrateX = (Math.random() - 0.5) * 1.5; const vibrateY = (Math.random() - 0.5) * 1.5; const breathe = Math.sin(previewTime * 0.1) * 2;
  pCtx.translate(vibrateX, vibrateY); pCtx.globalAlpha = 0.7;
  pCtx.fillStyle = p.colorSkin; pCtx.beginPath(); pCtx.ellipse(0, -10 + breathe, 18, 12, 0, 0, Math.PI*2); pCtx.fill(); pCtx.beginPath(); pCtx.ellipse(0, -2 + breathe, 24, 8, 0, 0, Math.PI*2); pCtx.fill();
  pCtx.globalAlpha = 0.9; for(let i=0; i<6; i++) { const offsetX = Math.sin(previewTime * 0.05 + i) * 12; const offsetY = Math.cos(previewTime * 0.03 + i) * 8; pCtx.fillStyle = 'rgba(255,255,255,0.4)'; pCtx.beginPath(); pCtx.arc(offsetX, -8 + offsetY, 1.5 + Math.sin(i)*1, 0, Math.PI*2); pCtx.fill(); }
  pCtx.globalAlpha = 1; pCtx.fillStyle = '#fff'; pCtx.beginPath(); pCtx.arc(-6, -14 + breathe, 4, 0, Math.PI*2); pCtx.arc(6, -14 + breathe, 4, 0, Math.PI*2); pCtx.fill(); pCtx.fillStyle = '#000'; pCtx.beginPath(); pCtx.arc(-5, -13 + breathe, 2, 0, Math.PI*2); pCtx.arc(7, -13 + breathe, 2, 0, Math.PI*2); pCtx.fill();
  pCtx.restore();
}
