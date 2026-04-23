// 🏙️ MtBank City — ИЗОМЕТРИЧЕСКАЯ ВЕРСИЯ (полная замена 2D игры)
console.log('🚀 city-game.js загружается...');

// ========== КОНФИГУРАЦИЯ ЗДАНИЙ (как в 2D версии) ==========
const BUILDING_TYPES = {
  coffee: { name: "Кофейня", icon: "☕", baseIncome: 50, upgradeMultiplier: 1.5, cost: 100, maxLevel: 5, bg: '#fff4e0', sprite: 'cafe.png' },
  flowershop: { name: "Цветочный магазин", icon: "🌷", baseIncome: 55, upgradeMultiplier: 1.53, cost: 110, maxLevel: 5, bg: '#ffe0f0', sprite: 'flower.png' },
  minimarket: { name: "Мини-магазин", icon: "🏪", baseIncome: 45, upgradeMultiplier: 1.52, cost: 90, maxLevel: 5, bg: '#e0ffe0', sprite: 'minimarket.png' },
  foodtruck: { name: "Фудтрак", icon: "🚚", baseIncome: 48, upgradeMultiplier: 1.54, cost: 95, maxLevel: 5, bg: '#ffe8d0', sprite: 'foodtruck.png' },
  icecream: { name: "Киоск мороженого", icon: "🍦", baseIncome: 42, upgradeMultiplier: 1.51, cost: 85, maxLevel: 5, bg: '#e0f0ff', sprite: 'icecream.png' },
  restaurant: { name: "Ресторан", icon: "🍽️", baseIncome: 100, upgradeMultiplier: 1.6, cost: 250, maxLevel: 5, bg: '#f0e0e0', sprite: 'restaurant.png' },
  shop: { name: "Магазин", icon: "🏪", baseIncome: 110, upgradeMultiplier: 1.62, cost: 280, maxLevel: 5, bg: '#e0e0ff', sprite: 'store.png' },
  autoservice: { name: "Автосервис", icon: "🔧", baseIncome: 120, upgradeMultiplier: 1.63, cost: 300, maxLevel: 5, bg: '#d0d0d0', sprite: 'autoservice.png' },
  itcompany: { name: "IT Компания", icon: "💻", baseIncome: 140, upgradeMultiplier: 1.65, cost: 350, maxLevel: 5, bg: '#c0e0ff', sprite: 'itoffice.png' },
  gasstation: { name: "Заправка", icon: "⛽", baseIncome: 115, upgradeMultiplier: 1.61, cost: 290, maxLevel: 5, bg: '#ffe0c0', sprite: 'gasstation.png' },
  businesspark: { name: "Бизнес-парк", icon: "🏢", baseIncome: 500, upgradeMultiplier: 1.85, cost: 1200, maxLevel: 5, bg: '#e0eeff', sprite: 'business-center.png' },
  cinema: { name: "Кинотеатр", icon: "🎬", baseIncome: 350, upgradeMultiplier: 1.78, cost: 800, maxLevel: 5, bg: '#e0d0ff', sprite: 'cinema.png' },
  construction: { name: "Стройкомпания", icon: "🏗️", baseIncome: 320, upgradeMultiplier: 1.75, cost: 750, maxLevel: 5, bg: '#ffe8a0', sprite: 'construction.png' },
  warehouse: { name: "Склад", icon: "🏭", baseIncome: 250, upgradeMultiplier: 1.7, cost: 600, maxLevel: 5, bg: '#d0c0a0', sprite: 'warehouse.png' },
  mall: { name: "Торговый центр", icon: "🏬", baseIncome: 450, upgradeMultiplier: 1.82, cost: 1100, maxLevel: 5, bg: '#ffd0e0', sprite: 'mall.png' }
};

const BUILDING_KEYS = ["coffee", "flowershop", "minimarket", "foodtruck", "icecream", "restaurant", "shop", "autoservice", "itcompany", "gasstation", "businesspark", "cinema", "construction", "warehouse", "mall"];

const SPRITE_PATH = 'buildings/';
const GRID_SIZE = 5;
let buildingPriceMultiplier = 1.0;

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let buildings = [];
let currentSelectedBlock = null;
let currentInfoIndex = null;
let incomeInterval = null;
let cameraZoom = 1.3;
let cameraX = 0, cameraY = 0;
let isDragging = false, hasMoved = false;
let dragStartX = 0, dragStartY = 0;
let dragCameraStartX = 0, dragCameraStartY = 0;

// DOM элементы
let isoContainer, coinDisplay, skillDisplay, totalIncomeDisplay;

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getCurrentUser() {
  if (typeof window.getCurrentUser === 'function') {
    return window.getCurrentUser();
  }
  try {
    var userId = localStorage.getItem("rr_current_user_id");
    if (!userId) return null;
    var usersRaw = localStorage.getItem("rr_registered_users");
    if (!usersRaw) return null;
    var users = JSON.parse(usersRaw);
    return users[userId] || null;
  } catch (e) {
    return null;
  }
}

function loadGameBuildings() {
  var currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  var gameKey = "rr_game_" + currentUser.id;
  try {
    var raw = localStorage.getItem(gameKey);
    if (!raw) {
      var emptyGrid = [];
      for (var i = 0; i < 25; i++) emptyGrid.push(null);
      var defaultData = { buildings: emptyGrid, lastUpdate: Date.now() };
      saveGameBuildings(defaultData);
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (e) {
    var emptyGrid = [];
    for (var i = 0; i < 25; i++) emptyGrid.push(null);
    return { buildings: emptyGrid, lastUpdate: Date.now() };
  }
}

function saveGameBuildings(data) {
  var currentUser = getCurrentUser();
  if (!currentUser) return;
  var gameKey = "rr_game_" + currentUser.id;
  localStorage.setItem(gameKey, JSON.stringify(data));
}

function getBuildingIncome(building) {
  if (!building) return 0;
  var typeData = BUILDING_TYPES[building.type];
  if (!typeData) return 0;
  return Math.floor(typeData.baseIncome * Math.pow(typeData.upgradeMultiplier, building.level - 1));
}

function getUpgradeCost(building) {
  if (!building) return 0;
  var typeData = BUILDING_TYPES[building.type];
  if (!typeData) return 0;
  return Math.floor(typeData.cost * Math.pow(1.3, building.level - 1));
}

function updateBuildingPriceMultiplier() {
  var buildingCount = 0;
  for (var i = 0; i < buildings.length; i++) {
    if (buildings[i]) buildingCount++;
  }
  buildingPriceMultiplier = Math.pow(1.1, buildingCount);
}

function syncBalanceToApp() {
  var currentUser = getCurrentUser();
  if (currentUser && typeof window.syncBalancesToDom === 'function') {
    window.balanceMtBanks = currentUser.balanceMtBanks;
    window.balanceSkillPoints = currentUser.balanceSkillPoints;
    window.syncBalancesToDom();
  }
}

// ========== ИЗОМЕТРИЧЕСКАЯ ПЛИТКА ==========
function tileBg(r, c) {
  const isCenter = (r === 2 && c === 2);
  const sh = isCenter ? '#FFD700' : ((r + c) % 2 === 0 ? '#5BC0BE' : '#4AB0AE');
  const lsh = isCenter ? '#DAA520' : '#3AA8A0';
  const rsh = isCenter ? '#B8860B' : '#2A8A82';
  const strokeColor = isCenter ? '#FFD700' : 'rgba(255,255,255,0.4)';
  
  const index = r * GRID_SIZE + c;
  const isEmpty = !buildings[index];
  const emptyMarker = (isEmpty && !isCenter) ? `<polygon points="36,12 52,20 36,28 20,20" fill="#4CAF50" opacity="0.7" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>` : '';
  
  return `
    <svg viewBox="0 0 72 64" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;">
      <polygon points="36,1 71,19 36,37 1,19" fill="${sh}" stroke="${strokeColor}" stroke-width="${isCenter ? '2.5' : '1.5'}"/>
      <polygon points="1,19 36,37 36,52 1,34" fill="${lsh}"/>
      <polygon points="36,37 71,19 71,34 36,52" fill="${rsh}"/>
      ${emptyMarker}
    </svg>
  `;
}

function getBuildingSpriteHTML(type, level) {
  const def = BUILDING_TYPES[type];
  if (!def) return '';
  
  return `
    <div style="position:absolute;bottom:28px;left:50%;transform:translateX(-50%);width:55px;height:55px;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;filter:drop-shadow(0 6px 4px rgba(0,0,0,0.25));z-index:10;">
      <img src="${SPRITE_PATH}${def.sprite}" alt="${def.name}" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div style="display:none;width:100%;height:100%;background:${def.bg};border-radius:8px;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#333;">${def.icon}</div>
    </div>
  `;
}

function makeTile(r, c) {
  const index = r * GRID_SIZE + c;
  const building = buildings[index];
  
  const buildingHTML = building ? getBuildingSpriteHTML(building.type, building.level) : '';
  
  const levelHTML = building ? `
    <div style="position:absolute;bottom:17px;left:50%;transform:translateX(-50%);background:rgba(30,30,30,0.35);backdrop-filter:blur(6px);border-radius:18px;padding:2px 6px;z-index:15;white-space:nowrap;">
      <span style="font-size:8px;font-weight:600;color:white;">Lv.${building.level}</span>
    </div>
  ` : '';
  
  const pending = building?.pendingIncome || 0;
  const incomeHTML = (pending > 0) ? `
    <div style="position:absolute;top:5px;right:5px;background:#4CAF50;border-radius:12px;padding:2px 6px;z-index:15;">
      <span style="font-size:7px;font-weight:bold;color:white;">+${Math.floor(pending)}</span>
    </div>
  ` : '';
  
  const emptyHTML = !building && !(r === 2 && c === 2) ? `
    <div style="position:absolute;top:35%;left:50%;transform:translate(-50%, -50%);width:40px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(100,100,100,0.45);border:2px dashed rgba(220,220,220,0.8);font-size:20px;font-weight:bold;color:rgba(255,255,255,0.8);pointer-events:none;z-index:20;">+</div>
  ` : '';
  
  return tileBg(r, c) + levelHTML + incomeHTML + buildingHTML + emptyHTML;
}

function renderGrid() {
  if (!isoContainer) return;
  
  const TW = 90, TH = 48;
  const CW = GRID_SIZE * TW, CH = GRID_SIZE * (TH / 2) + TH + 80;
  
  isoContainer.style.width = CW + 'px';
  isoContainer.style.height = CH + 'px';
  isoContainer.style.transformOrigin = 'center center';
  isoContainer.innerHTML = '';
  
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const sx = (c - r) * (TW / 2) + CW / 2 - TW / 2;
      const sy = (c + r) * (TH / 2) + 15;
      const index = r * GRID_SIZE + c;
      
      const div = document.createElement('div');
      div.className = 'city-tile';
      div.style.cssText = `left:${sx}px;top:${sy}px;width:72px;height:64px;cursor:pointer;`;
      div.innerHTML = makeTile(r, c);
      div.onclick = (function(idx) { return function() { onTileClick(idx); }; })(index);
      
      isoContainer.appendChild(div);
    }
  }
  
  updateCameraTransform();
}

function onTileClick(index) {
  if (hasMoved) {
    hasMoved = false;
    return;
  }
  
  const building = buildings[index];
  
  if (building) {
    openInfoModal(index);
  } else if (index !== 12) {
    openBuildModal(index);
  }
}

// ========== МОДАЛЬНЫЕ ОКНА ==========
function openBuildModal(blockIndex) {
  currentSelectedBlock = blockIndex;
  var container = document.getElementById("build-options");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Группируем здания по категориям
  var categories = {
    starter: { name: "⭐ Стартовые", buildings: BUILDING_KEYS.slice(0, 5) },
    medium: { name: "🏢 Средние", buildings: BUILDING_KEYS.slice(5, 10) },
    elite: { name: "🏦 Элитные", buildings: BUILDING_KEYS.slice(10, 15) }
  };
  
  for (var cat in categories) {
    var header = document.createElement("div");
    header.className = "build-category-header";
    header.innerHTML = `<span class="build-category-title">${categories[cat].name}</span>`;
    container.appendChild(header);
    
    for (var i = 0; i < categories[cat].buildings.length; i++) {
      var key = categories[cat].buildings[i];
      var type = BUILDING_TYPES[key];
      var price = Math.floor(type.cost * buildingPriceMultiplier);
      
      var option = document.createElement("div");
      option.className = "build-option";
      option.innerHTML = `
        <div class="build-option__icon">${type.icon}</div>
        <div class="build-option__name">${type.name}</div>
        <div class="build-option__cost">⭐ ${price}</div>
      `;
      option.onclick = (function(k, p) { return function() { buildBuilding(blockIndex, k, p); }; })(key, price);
      container.appendChild(option);
    }
  }
  
  var modal = document.getElementById("build-modal");
  if (modal) modal.removeAttribute("hidden");
}

function buildBuilding(index, type, cost) {
  var currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  updateBuildingPriceMultiplier();
  
  if ((currentUser.balanceSkillPoints || 0) < cost) {
    showGameToast("❌ Недостаточно очков прокачки! Нужно " + cost + " ⭐");
    return false;
  }
  
  if (buildings[index]) {
    showGameToast("❌ Здесь уже есть здание!");
    return false;
  }
  
  buildings[index] = {
    type: type,
    level: 1,
    pendingIncome: 0,
    purchasePrice: cost
  };
  
  currentUser.balanceSkillPoints -= cost;
  
  var gameData = { buildings: buildings, lastUpdate: Date.now() };
  saveGameBuildings(gameData);
  
  var users = window.loadAllUsers ? window.loadAllUsers() : {};
  users[currentUser.id] = currentUser;
  if (typeof window.saveAllUsers === 'function') window.saveAllUsers(users);
  
  syncBalanceToApp();
  updateDisplays();
  renderGrid();
  
  showGameToast("✅ Построено: " + BUILDING_TYPES[type].name + " за " + cost + " ⭐!");
  closeBuildModal();
  return true;
}

function closeBuildModal() {
  var modal = document.getElementById("build-modal");
  if (modal) modal.setAttribute("hidden", "");
  currentSelectedBlock = null;
}

function openInfoModal(index) {
  var building = buildings[index];
  if (!building) return;
  
  currentInfoIndex = index;
  var typeData = BUILDING_TYPES[building.type];
  
  var iconContainer = document.getElementById("info-icon");
  if (iconContainer) {
    iconContainer.innerHTML = `<div style="font-size:48px;">${typeData.icon}</div>`;
  }
  
  var purchasePrice = building.purchasePrice || typeData.cost;
  var sellPrice = Math.floor(purchasePrice / 2);
  
  document.getElementById("info-title").textContent = typeData.name;
  document.getElementById("info-type").textContent = typeData.name;
  document.getElementById("info-level").textContent = building.level;
  document.getElementById("info-income").textContent = getBuildingIncome(building);
  document.getElementById("info-pending").textContent = Math.floor(building.pendingIncome || 0);
  document.getElementById("info-upgrade-cost").textContent = getUpgradeCost(building);
  
  var sellValueSpan = document.getElementById("info-sell-value");
  if (sellValueSpan) sellValueSpan.textContent = sellPrice;
  
  var modal = document.getElementById("info-modal");
  if (modal) modal.removeAttribute("hidden");
}

function closeInfoModal() {
  var modal = document.getElementById("info-modal");
  if (modal) modal.setAttribute("hidden", "");
  currentInfoIndex = null;
}

function collectBuildingIncome(index) {
  var currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  var building = buildings[index];
  if (!building) return false;
  
  var amount = Math.floor(building.pendingIncome || 0);
  if (amount <= 0) {
    showGameToast("💰 Нет накопленного дохода!");
    return false;
  }
  
  currentUser.balanceMtBanks = (currentUser.balanceMtBanks || 0) + amount;
  building.pendingIncome = 0;
  
  var users = window.loadAllUsers ? window.loadAllUsers() : {};
  users[currentUser.id] = currentUser;
  if (typeof window.saveAllUsers === 'function') window.saveAllUsers(users);
  
  var gameData = { buildings: buildings, lastUpdate: Date.now() };
  saveGameBuildings(gameData);
  
  syncBalanceToApp();
  updateDisplays();
  renderGrid();
  
  showGameToast("💰 Получено " + amount + " MTBank Tokens!");
  closeInfoModal();
  return true;
}

function upgradeBuilding(index) {
  var currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  var building = buildings[index];
  if (!building) return false;
  
  var typeData = BUILDING_TYPES[building.type];
  if (building.level >= typeData.maxLevel) {
    showGameToast(`❌ ${typeData.name} достиг максимального уровня!`);
    return false;
  }
  
  var cost = getUpgradeCost(building);
  
  if ((currentUser.balanceSkillPoints || 0) < cost) {
    showGameToast("❌ Недостаточно очков прокачки! Нужно " + cost + " ⭐");
    return false;
  }
  
  building.level++;
  currentUser.balanceSkillPoints -= cost;
  
  var users = window.loadAllUsers ? window.loadAllUsers() : {};
  users[currentUser.id] = currentUser;
  if (typeof window.saveAllUsers === 'function') window.saveAllUsers(users);
  
  var gameData = { buildings: buildings, lastUpdate: Date.now() };
  saveGameBuildings(gameData);
  
  syncBalanceToApp();
  updateDisplays();
  renderGrid();
  
  showGameToast("⬆️ " + typeData.name + " улучшен до " + building.level + " уровня!");
  closeInfoModal();
  return true;
}

function sellBuilding(index) {
  var currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  var building = buildings[index];
  if (!building) return false;
  
  var purchasePrice = building.purchasePrice;
  if (!purchasePrice) {
    var typeData = BUILDING_TYPES[building.type];
    purchasePrice = typeData.cost;
  }
  
  var sellPrice = Math.floor(purchasePrice / 2);
  
  currentUser.balanceSkillPoints = (currentUser.balanceSkillPoints || 0) + sellPrice;
  buildings[index] = null;
  
  var users = window.loadAllUsers ? window.loadAllUsers() : {};
  users[currentUser.id] = currentUser;
  if (typeof window.saveAllUsers === 'function') window.saveAllUsers(users);
  
  var gameData = { buildings: buildings, lastUpdate: Date.now() };
  saveGameBuildings(gameData);
  
  syncBalanceToApp();
  updateDisplays();
  renderGrid();
  
  showGameToast("💰 Здание продано! Выручено " + sellPrice + " ⭐");
  closeInfoModal();
  return true;
}

function collectAllIncome() {
  var currentUser = getCurrentUser();
  if (!currentUser) return;
  
  var totalCollected = 0;
  for (var i = 0; i < buildings.length; i++) {
    var building = buildings[i];
    if (building && building.pendingIncome && building.pendingIncome > 0) {
      totalCollected += Math.floor(building.pendingIncome);
      building.pendingIncome = 0;
    }
  }
  
  if (totalCollected > 0) {
    currentUser.balanceMtBanks = (currentUser.balanceMtBanks || 0) + totalCollected;
    
    var users = window.loadAllUsers ? window.loadAllUsers() : {};
    users[currentUser.id] = currentUser;
    if (typeof window.saveAllUsers === 'function') window.saveAllUsers(users);
    
    var gameData = { buildings: buildings, lastUpdate: Date.now() };
    saveGameBuildings(gameData);
    
    syncBalanceToApp();
    updateDisplays();
    renderGrid();
    
    showGameToast("🧺 Собрано " + totalCollected + " MTBank Tokens!");
  } else {
    showGameToast("😴 Нет дохода для сбора");
  }
}

function updatePendingIncome() {
  var currentUser = getCurrentUser();
  if (!currentUser) return;
  
  var gameData = loadGameBuildings();
  buildings = gameData.buildings;
  
  var now = Date.now();
  var timeDiff = (now - (gameData.lastUpdate || now)) / (1000 * 60 * 60);
  
  if (timeDiff > 0 && timeDiff < 24) {
    for (var i = 0; i < buildings.length; i++) {
      var building = buildings[i];
      if (building) {
        if (!building.pendingIncome) building.pendingIncome = 0;
        var hourlyIncome = getBuildingIncome(building);
        var earned = Math.floor(hourlyIncome * timeDiff);
        building.pendingIncome += earned;
      }
    }
  }
  
  gameData.lastUpdate = now;
  saveGameBuildings(gameData);
  renderGrid();
  updateDisplays();
}

function updateDisplays() {
  var currentUser = getCurrentUser();
  if (!currentUser) return;
  
  if (coinDisplay) coinDisplay.textContent = (currentUser.balanceMtBanks || 0).toLocaleString();
  if (skillDisplay) skillDisplay.textContent = (currentUser.balanceSkillPoints || 0).toLocaleString();
  
  var totalHourly = 0;
  for (var i = 0; i < buildings.length; i++) {
    var b = buildings[i];
    if (b) totalHourly += getBuildingIncome(b);
  }
  if (totalIncomeDisplay) totalIncomeDisplay.textContent = totalHourly;
}

function showGameToast(message) {
  var toast = document.getElementById("buy-toast");
  if (toast) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(function() {
      toast.classList.remove("is-visible");
    }, 2000);
  }
}

function startIncomeTimer() {
  if (incomeInterval) clearInterval(incomeInterval);
  incomeInterval = setInterval(function() {
    updatePendingIncome();
  }, 60000);
}

// ========== УПРАВЛЕНИЕ КАМЕРОЙ ==========
function updateCameraTransform() {
  if (isoContainer) {
    isoContainer.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${cameraZoom})`;
  }
}

function resetCamera() {
  cameraX = 0;
  cameraY = 0;
  cameraZoom = 1.3;
  updateCameraTransform();
}

function setupCameraControls() {
  const gameArea = document.querySelector('.city-game-area');
  if (!gameArea) return;
  
  gameArea.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    cameraZoom = Math.min(2.2, Math.max(0.9, cameraZoom + delta));
    updateCameraTransform();
  }, { passive: false });
  
  gameArea.addEventListener('mousedown', (e) => {
    if (e.target.closest('.city-tile') || e.target.closest('button')) return;
    isDragging = true;
    hasMoved = false;
    dragStartX = e.clientX; 
    dragStartY = e.clientY;
    dragCameraStartX = cameraX; 
    dragCameraStartY = cameraY;
    gameArea.style.cursor = 'grabbing';
    e.preventDefault();
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
    cameraX = dragCameraStartX + dx;
    cameraY = dragCameraStartY + dy;
    updateCameraTransform();
  });
  
  window.addEventListener('mouseup', () => { 
    isDragging = false; 
    if (gameArea) gameArea.style.cursor = 'grab';
    setTimeout(() => { hasMoved = false; }, 50);
  });
  
  gameArea.style.cursor = 'grab';
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initGame() {
  console.log("🏗 Инициализация изометрической игры...");
  
  var gameData = loadGameBuildings();
  buildings = gameData.buildings;
  
  // Убеждаемся, что МТБанк в центре
  if (!buildings[12]) {
    buildings[12] = {
      type: "mtbank",
      level: 1,
      pendingIncome: 0,
      purchasePrice: 0
    };
  }
  
  updateBuildingPriceMultiplier();
  updatePendingIncome();
  renderGrid();
  updateDisplays();
  startIncomeTimer();
  
  // Кнопки
  document.getElementById('city-reset-camera')?.addEventListener('click', resetCamera);
  document.getElementById('city-collect-all-btn')?.addEventListener('click', collectAllIncome);
  
  // Модальные окна
  document.getElementById('build-modal-close')?.addEventListener('click', closeBuildModal);
  document.getElementById('info-modal-close')?.addEventListener('click', closeInfoModal);
  document.getElementById('info-collect-btn')?.addEventListener('click', function() {
    if (currentInfoIndex !== null) collectBuildingIncome(currentInfoIndex);
  });
  document.getElementById('info-upgrade-btn')?.addEventListener('click', function() {
    if (currentInfoIndex !== null) upgradeBuilding(currentInfoIndex);
  });
  document.getElementById('info-sell-btn')?.addEventListener('click', function() {
    if (currentInfoIndex !== null) sellBuilding(currentInfoIndex);
  });
  
  // Клик по оверлею
  document.querySelector('#build-modal .build-modal__overlay')?.addEventListener('click', closeBuildModal);
  document.querySelector('#info-modal .info-modal__overlay')?.addEventListener('click', closeInfoModal);
  
  setupCameraControls();
}

// Запуск при загрузке
setTimeout(function() {
  const panel = document.getElementById('panel-game');
  if (panel && panel.classList.contains('is-active')) {
    initGame();
  }
}, 300);

// Делаем функции глобальными
window.initCityGame = initGame;
window.renderCityGrid = renderGrid;