const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// Получаем ник из URL
const urlParams = new URLSearchParams(window.location.search);
const currentNick = urlParams.get('nick') || 'Unknown';

const state = {
  time: 0, isBlinking: false,
  player: { 
    w: 24, h: 64, facing: 1, gender: 'male', 
    colorSkin: '#f1c27d', colorHair: '#3a2050', colorEyes: '#000000', 
    colorShirt: '#7a3cff', colorPants: '#1a1a1a', hatColor: '#1a1a1a', colorShoes: '#1a1a1a',
    hairStyle: 'straight', topStyle: 'tshirt', bottomStyle: 'pants', shoesStyle: 'boots', hatType: 'none', petType: 'none'
  }
};

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

const optionsPanel = document.getElementById('optionsPanel');
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const colorPalette = document.getElementById('colorPalette');

function openCategory(catKey) {
  const data = categoriesData[catKey];
  
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.cat-btn[data-category="${catKey}"]`).classList.add('active');

  panelTitle.textContent = data.title;
  panelContent.innerHTML = '';

  if (data.options && data.options.length > 0) {
    data.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      
      if (state.player[data.styleKey] === opt.val) btn.classList.add('active');
      if (opt.premium) btn.classList.add('premium');
      
      btn.textContent = opt.label;
      btn.onclick = () => {
        state.player[data.styleKey] = opt.val;
        document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (opt.val === 'slime') {
          state.player.topStyle = 'none';
          state.player.bottomStyle = 'none';
          state.player.shoesStyle = 'none';
          state.player.hairStyle = 'bald';
        } else if (catKey === 'body' && opt.val !== 'slime') {
          state.player.topStyle = 'tshirt';
          state.player.bottomStyle = 'pants';
          state.player.shoesStyle = 'boots';
          state.player.hairStyle = 'straight';
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
      
      if (state.player[data.stateKey] === color) btn.classList.add('active');
      btn.onclick = () => {
        state.player[data.stateKey] = color;
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      colorPalette.appendChild(btn);
    });
  }
  optionsPanel.classList.add('open');
}

document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => openCategory(e.currentTarget.dataset.category));
});

document.getElementById('closePanelBtn').addEventListener('click', () => {
  optionsPanel.classList.remove('open');
});

openCategory('body');

document.getElementById('closeWardrobeBtn').addEventListener('click', () => {
  window.location.href = '/index.html?nick=' + currentNick;
});

// СОХРАНЕНИЕ СКИНА НА СЕРВЕР
document.getElementById('wearBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('/saveSkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: currentNick, appearance: state.player })
    });
    
    if (response.ok) { console.log("Скин успешно сохранен!"); } 
    else { console.error("Ошибка сохранения"); }
  } catch (e) {
    console.error("Ошибка сети:", e);
  }
  window.location.href = '/index.html?nick=' + currentNick;
});


// --- ФУНКЦИИ ОТРИСОВКИ ---
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

function updateParticles() {
  if (state.player.petType === 'pumpkin' && state.time - lastPumpkinSpawn > 20) { 
    if (Math.random() < 0.8) { 
      candyParticles.push({
        x: canvas.width / 2 + 100,
        y: canvas.height - 90,
        vx: (Math.random() - 0.5) * 4,
        vy: -4 - Math.random() * 3,
        life: 1,
        color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]
      });
      lastPumpkinSpawn = state.time;
    }
  }

  for (let i = candyParticles.length - 1; i >= 0; i--) {
    let p = candyParticles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.02;
    if (p.life <= 0) candyParticles.splice(i, 1);
  }
}

function drawSlime(p) {
  const scale = 4.0;
  const cx = canvas.width / 2;
  const cy = canvas.height - 60;
  
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const vibrateX = (Math.random() - 0.5) * 1.5;
  const vibrateY = (Math.random() - 0.5) * 1.5;
  const breathe = Math.sin(state.time * 0.1) * 2;
  
  ctx.translate(vibrateX, vibrateY);
  ctx.globalAlpha = 0.7;

  ctx.fillStyle = p.colorSkin;
  ctx.beginPath();
  ctx.ellipse(0, -10 + breathe, 18, 12, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -2 + breathe, 24, 8, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.globalAlpha = 0.9; 
  for(let i=0; i<6; i++) {
    const offsetX = Math.sin(state.time * 0.05 + i) * 12;
    const offsetY = Math.cos(state.time * 0.03 + i) * 8;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(offsetX, -8 + offsetY, 1.5 + Math.sin(i)*1, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-6, -14 + breathe, 4, 0, Math.PI*2); ctx.arc(6, -14 + breathe, 4, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-5, -13 + breathe, 2, 0, Math.PI*2); ctx.arc(7, -13 + breathe, 2, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

function drawCharacter(p) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

  if (p.gender === 'slime') {
    drawSlime(p);
  } else {
    ctx.save();
    
    const scale = 4.0; 
    const startX = (canvas.width / 2) - (p.w * scale / 2);
    const startY = (canvas.height - 60) - (p.h * scale);
    
    ctx.translate(startX, startY);
    ctx.scale(scale, scale);

    const breathe = Math.sin(state.time * 0.05) * 1.5;
    ctx.translate(0, breathe);

    const cSkin = p.colorSkin;
    const cHair = p.colorHair;
    const cEyes = p.colorEyes;
    const cShirt = p.colorShirt;
    const cPants = p.colorPants;
    const hType = p.hatType;
    const hColor = p.hatColor;
    const isFemale = p.gender === 'female';
    
    const shoulderW = isFemale ? 14 : 16;
    const armX_L = isFemale ? 2 : 0;
    const armX_R = isFemale ? 18 : 20;

    ctx.fillStyle = cSkin;
    ctx.fillRect(5, 42, 6, 18); ctx.fillRect(13, 42, 6, 18);
    ctx.fillRect(armX_L, 24, 4, 15); ctx.fillRect(armX_R, 24, 4, 15);

    if (p.topStyle !== 'dress') {
      if (p.bottomStyle === 'pants') { 
        ctx.fillStyle = cPants; ctx.fillRect(5, 40, 6, 20); ctx.fillRect(13, 40, 6, 20); 
      } else if (p.bottomStyle === 'shorts') { 
        ctx.fillStyle = cPants; ctx.fillRect(5, 40, 6, 9); ctx.fillRect(13, 40, 6, 9); 
      } else if (p.bottomStyle === 'skirt_short') { 
        ctx.fillStyle = cPants; ctx.beginPath(); ctx.moveTo(4, 40); ctx.lineTo(20, 40); ctx.lineTo(24, 48); ctx.lineTo(0, 48); ctx.fill(); 
      } else if (p.bottomStyle === 'skirt_tights') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(5, 40, 6, 20); ctx.fillRect(13, 40, 6, 20);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)'; for(let ty=41; ty<60; ty+=2) { ctx.fillRect(6, ty, 1, 1); ctx.fillRect(8, ty, 1, 1); ctx.fillRect(10, ty, 1, 1); ctx.fillRect(14, ty, 1, 1); ctx.fillRect(16, ty, 1, 1); ctx.fillRect(18, ty, 1, 1); }
        ctx.fillStyle = cPants; ctx.beginPath(); ctx.moveTo(4, 40); ctx.lineTo(20, 40); ctx.lineTo(24, 48); ctx.lineTo(0, 48); ctx.fill(); 
      }
    }

    if (p.shoesStyle === 'boots') {
      ctx.fillStyle = p.colorShoes; ctx.fillRect(5, 54, 6, 6); ctx.fillRect(13, 54, 6, 6);
      ctx.fillStyle = shadeColor(p.colorShoes, -40); ctx.fillRect(5, 57, 6, 3); ctx.fillRect(13, 57, 6, 3);
    } else if (p.shoesStyle === 'sneakers') {
      ctx.fillStyle = p.colorShoes; ctx.fillRect(5, 54, 6, 4); ctx.fillRect(13, 54, 6, 4);
      ctx.fillStyle = '#fff'; ctx.fillRect(5, 56, 6, 4); ctx.fillRect(13, 56, 6, 4);
      ctx.fillStyle = shadeColor(p.colorShoes, -30); ctx.fillRect(6, 55, 4, 1); ctx.fillRect(14, 55, 4, 1);
    } else if (p.shoesStyle === 'heels') {
      ctx.fillStyle = p.colorShoes; ctx.fillRect(5, 52, 6, 3); ctx.fillRect(13, 52, 6, 3); 
      ctx.fillRect(6, 55, 4, 1); ctx.fillRect(14, 55, 4, 1); ctx.fillRect(7, 56, 1, 4); ctx.fillRect(15, 56, 1, 4); 
    }

    const bodyX = isFemale ? 6 : 4; 
    ctx.fillStyle = cSkin; ctx.fillRect(bodyX, 24, shoulderW, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    if (isFemale) { ctx.fillRect(bodyX + 2, 24, shoulderW - 4, 2); ctx.fillRect(bodyX + (shoulderW/2) - 1, 26, 2, 6); } 
    else { ctx.fillRect(bodyX + 2, 24, shoulderW - 4, 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bodyX + (shoulderW/2) - 1, 36, 2, 2);

    ctx.fillStyle = cShirt; 
    if (p.topStyle === 'tshirt') {
      ctx.fillRect(bodyX, 24, shoulderW, 16); ctx.fillRect(armX_L, 24, 4, 10); ctx.fillRect(armX_R, 24, 4, 10); 
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bodyX + 3, 24, shoulderW - 6, 2);
    } else if (p.topStyle === 'vest') {
      ctx.fillRect(bodyX, 24, shoulderW, 16); ctx.fillStyle = '#fff'; ctx.fillRect(bodyX + 6, 24, 4, 16); 
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bodyX + 3, 24, shoulderW - 6, 2);
    } else if (p.topStyle === 'hoodie') {
      ctx.fillRect(bodyX, 24, shoulderW, 16); ctx.fillStyle = cShirt; ctx.fillRect(bodyX + 2, 22, shoulderW - 4, 4);
      ctx.fillRect(armX_L, 24, 4, 14); ctx.fillRect(armX_R, 24, 4, 14); 
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(bodyX + 4, 32, shoulderW - 8, 6); 
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bodyX + 3, 24, shoulderW - 6, 2);
    } else if (p.topStyle === 'dress') {
      ctx.fillRect(bodyX - 1, 24, shoulderW + 2, 14); ctx.fillStyle = '#ff0000'; ctx.fillRect(bodyX - 1, 36, shoulderW + 2, 2); 
      ctx.fillStyle = cShirt; ctx.beginPath(); ctx.moveTo(bodyX - 1, 38); ctx.lineTo(bodyX + shoulderW + 1, 38); ctx.lineTo(bodyX + shoulderW + 8, 55); ctx.lineTo(bodyX - 8, 55); ctx.fill(); 
      ctx.fillRect(armX_L, 24, 4, 8); ctx.fillRect(armX_R, 24, 4, 8); 
    } else if (p.topStyle === 'tank_top') {
      ctx.fillStyle = cShirt; ctx.fillRect(bodyX, 27, shoulderW, 6); ctx.fillRect(bodyX + 2, 24, 2, 3); ctx.fillRect(bodyX + shoulderW - 4, 24, 2, 3);
    }

    ctx.fillStyle = cSkin; ctx.fillRect(3, 0, 18, 20);
    if (isFemale) { ctx.fillStyle = 'rgba(255, 105, 180, 0.4)'; ctx.fillRect(3, 12, 3, 3); ctx.fillRect(18, 12, 3, 3); }

    ctx.fillStyle = cSkin; ctx.fillRect(1, 8, 2, 4); ctx.fillRect(21, 8, 2, 4);
    
    if (hType !== 'mask' && hType !== 'frankenstein') {
      const eyeOffset = p.facing === 1 ? 2 : 0; 
      if (cEyes === '❤️') {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(7 + eyeOffset, 7, 2, 2); ctx.fillRect(10 + eyeOffset, 7, 2, 2); ctx.fillRect(6 + eyeOffset, 9, 7, 2); ctx.fillRect(7 + eyeOffset, 11, 5, 1); ctx.fillRect(8 + eyeOffset, 12, 3, 1); ctx.fillRect(9 + eyeOffset, 13, 1, 1);
        ctx.fillRect(14 + eyeOffset, 7, 2, 2); ctx.fillRect(17 + eyeOffset, 7, 2, 2); ctx.fillRect(13 + eyeOffset, 9, 7, 2); ctx.fillRect(14 + eyeOffset, 11, 5, 1); ctx.fillRect(15 + eyeOffset, 12, 3, 1); ctx.fillRect(16 + eyeOffset, 13, 1, 1);
      } else if (state.isBlinking) {
        ctx.fillStyle = cSkin; ctx.fillRect(6 + eyeOffset, 6, 5, 6); ctx.fillRect(13 + eyeOffset, 6, 5, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(6 + eyeOffset, 8, 5, 1); ctx.fillRect(13 + eyeOffset, 8, 5, 1);
      } else {
        ctx.fillStyle = '#fff'; ctx.fillRect(6 + eyeOffset, 6, 5, 6); ctx.fillRect(13 + eyeOffset, 6, 5, 6);
        ctx.fillStyle = cEyes; ctx.fillRect(8 + eyeOffset, 8, 2, 3); ctx.fillRect(15 + eyeOffset, 8, 2, 3);
      }
      if (isFemale) { ctx.fillStyle = '#000'; ctx.fillRect(5 + eyeOffset, 5, 6, 1); ctx.fillRect(12 + eyeOffset, 5, 6, 1); }
      ctx.fillStyle = '#000'; ctx.fillRect(9, 15, 6, 2);
    }

    if (p.hairStyle !== 'bald') {
      if (p.hairStyle === 'braid') {
        const hx = 19; const hairDark = shadeColor(cHair, -30); const hairLight = shadeColor(cHair, 30);
        ctx.fillStyle = cHair; ctx.fillRect(hx, 6, 6, 22); 
        ctx.fillStyle = hairDark; for(let i=0; i<6; i++) { ctx.fillRect(hx, 8 + i*4, 6, 2); }
        ctx.fillStyle = hairLight; for(let i=0; i<5; i++) { ctx.fillRect(hx + 2, 10 + i*4, 2, 2); }
        ctx.fillStyle = '#ff0000'; ctx.fillRect(hx + 1, 28, 4, 2);
      } else {
        ctx.fillStyle = cHair;
        if (isFemale) { ctx.fillRect(1, 0, 22, 8); ctx.fillRect(0, 8, 4, 14); ctx.fillRect(20, 8, 4, 14); } 
        else { ctx.fillRect(2, 0, 20, 6); }
        if (p.hairStyle === 'curly') {
          const hairDark = shadeColor(cHair, -20); const hairLight = shadeColor(cHair, 20);
          ctx.fillStyle = cHair;
          ctx.beginPath();
          ctx.arc(4, 2, 3, 0, Math.PI*2); ctx.arc(10, 1, 3, 0, Math.PI*2); ctx.arc(16, 1, 3, 0, Math.PI*2); ctx.arc(22, 2, 3, 0, Math.PI*2);
          ctx.arc(2, 6, 2.5, 0, Math.PI*2); ctx.arc(7, 5, 2.5, 0, Math.PI*2); ctx.arc(13, 5, 2.5, 0, Math.PI*2); ctx.arc(19, 5, 2.5, 0, Math.PI*2);
          if(isFemale) { ctx.arc(1, 10, 2.5, 0, Math.PI*2); ctx.arc(21, 10, 2.5, 0, Math.PI*2); }
          ctx.fill();
          ctx.fillStyle = hairLight; ctx.beginPath();
          ctx.arc(6, 3, 1.5, 0, Math.PI*2); ctx.arc(12, 2, 1.5, 0, Math.PI*2); ctx.arc(18, 3, 1.5, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = hairDark; ctx.beginPath();
          ctx.arc(3, 5, 1.5, 0, Math.PI*2); ctx.arc(15, 4, 1.5, 0, Math.PI*2); ctx.arc(21, 5, 1.5, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }

    if (hType === 'cap') { 
      ctx.fillStyle = hColor; ctx.fillRect(2, -1, 20, 6); ctx.fillRect(15, 2, 8, 3); 
      ctx.fillStyle = '#ffd700'; ctx.fillRect(7, 1, 3, 2); ctx.fillRect(12, 1, 3, 2); 
    } else if (hType === 'straw') { 
      ctx.fillStyle = hColor; ctx.fillRect(-2, 2, 28, 4); ctx.fillRect(5, -3, 14, 6); ctx.fillStyle = '#ff0000'; ctx.fillRect(5, 1, 14, 2); 
    } else if (hType === 'crown') { 
      ctx.fillStyle = hColor; ctx.fillRect(4, -4, 16, 4); 
      ctx.beginPath(); ctx.moveTo(4, -4); ctx.lineTo(6, -10); ctx.lineTo(9, -4); ctx.lineTo(12, -11); ctx.lineTo(15, -4); ctx.lineTo(18, -10); ctx.lineTo(20, -4); ctx.fill(); 
      ctx.fillStyle = '#ff0000'; ctx.fillRect(7, -2, 2, 2); ctx.fillRect(11, -3, 2, 2); ctx.fillRect(15, -2, 2, 2);
    } else if (hType === 'witch_hat') {
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(12, -1, 24, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, -1); ctx.lineTo(22, -1); ctx.lineTo(16, -22); ctx.fill();
      ctx.beginPath(); ctx.moveTo(16, -22); ctx.lineTo(26, -18); ctx.lineTo(18, -15); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(12, -15); ctx.lineTo(14, -15); ctx.lineTo(10, -1); ctx.fill();
      ctx.fillStyle = '#228b22'; ctx.fillRect(4, -5, 16, 3); ctx.fillStyle = '#ffd700'; ctx.fillRect(10, -5, 4, 3);
    } else if (hType === 'frankenstein') {
      ctx.fillStyle = '#8b9a8b'; ctx.fillRect(2, 2, 20, 18); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(2, 0, 20, 4);
      ctx.fillStyle = '#cccccc'; ctx.fillRect(0, 10, 3, 4); ctx.fillRect(21, 10, 3, 4);
      ctx.fillStyle = '#000'; ctx.fillRect(8, 16, 8, 1); ctx.fillRect(12, 12, 1, 3); ctx.fillStyle = '#ff0000'; ctx.fillRect(6, 6, 4, 2); ctx.fillRect(14, 6, 4, 2);
    } else if (hType === 'cat_ears') {
      ctx.fillStyle = hColor; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(6, -12); ctx.lineTo(12, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(18, -12); ctx.lineTo(22, 0); ctx.fill();
      ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(7, -8); ctx.lineTo(10, -1); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(17, -8); ctx.lineTo(19, -1); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(2, 14); ctx.lineTo(-4, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, 16); ctx.lineTo(-4, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, 14); ctx.lineTo(28, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(22, 16); ctx.lineTo(28, 16); ctx.stroke();
    } else if (hType === 'horns') { 
      ctx.fillStyle = hColor; ctx.beginPath(); ctx.moveTo(3, 2); ctx.lineTo(1, -4); ctx.lineTo(6, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(21, 2); ctx.lineTo(23, -4); ctx.lineTo(18, 0); ctx.fill(); 
    } else if (hType === 'mask') {
      ctx.fillStyle = hColor; ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(22, 4); ctx.lineTo(20, 20); ctx.lineTo(18, 22); ctx.lineTo(6, 22); ctx.lineTo(4, 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(12, 4); ctx.quadraticCurveTo(10, 10, 12, 16); ctx.quadraticCurveTo(14, 10, 12, 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(10, 12); ctx.lineTo(8, 14); ctx.lineTo(4, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(18, 6); ctx.lineTo(14, 12); ctx.lineTo(16, 14); ctx.lineTo(20, 8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(4, 16, 16, 5); ctx.fillStyle = '#000000'; for(let i=4; i<20; i+=3) { ctx.fillRect(i, 16, 1, 5); }
    }

    ctx.restore();
  }

  if (p.petType === 'bat') {
    const px = canvas.width / 2 + Math.cos(state.time * 0.05) * 80; const py = canvas.height - 200 + Math.sin(state.time * 0.05) * 30;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 20, py - 10); ctx.lineTo(px - 25, py + 10); ctx.fill(); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 20, py - 10); ctx.lineTo(px + 25, py + 10); ctx.fill();
  } else if (p.petType === 'cat') {
    const px = canvas.width / 2 + 100; const py = canvas.height - 60;
    ctx.fillStyle = '#000'; ctx.fillRect(px, py - 40, 35, 40); ctx.beginPath(); ctx.arc(px + 17, py - 45, 18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px + 5, py - 60); ctx.lineTo(px, py - 80); ctx.lineTo(px + 20, py - 65); ctx.fill(); ctx.beginPath(); ctx.moveTo(px + 30, py - 60); ctx.lineTo(px + 35, py - 80); ctx.lineTo(px + 15, py - 65); ctx.fill();
    ctx.fillStyle = '#ff0'; ctx.fillRect(px + 10, py - 48, 6, 6); ctx.fillRect(px + 22, py - 48, 6, 6);
  } else if (p.petType === 'pumpkin') {
    const px = canvas.width / 2 + 100; const py = canvas.height - 60;
    ctx.fillStyle = '#ff8c00'; ctx.beginPath(); ctx.ellipse(px + 15, py - 25, 20, 15, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#228b22'; ctx.fillRect(px + 12, py - 42, 6, 6);
    if (state.isBlinking) { ctx.fillStyle = '#000'; ctx.fillRect(px + 5, py - 28, 6, 2); ctx.fillRect(px + 18, py - 28, 6, 2); } 
    else { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px + 8, py - 28, 3, 0, Math.PI*2); ctx.arc(px + 21, py - 28, 3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(px + 7, py - 29, 1, 1); ctx.fillRect(px + 20, py - 29, 1, 1); }
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px + 15, py - 20, 6, 0, Math.PI); ctx.stroke();
  }

  for (let p of candyParticles) { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, 4, 4); ctx.globalAlpha = 1; }
}

function loop() {
  state.time++;
  if (state.time % 200 === 0) state.isBlinking = true;
  if (state.time % 200 === 15) state.isBlinking = false;
  
  updateParticles();
  drawCharacter(state.player);
  requestAnimationFrame(loop);
}
loop();
