// Игровое состояние
let gameState = {
    crystals: 0,
    coins: 0,
    bats: [],
    autoGatherEnabled: false,
    gatheringInterval: null
};

// Типы летучих мышей с их редкостью
const batTypes = {
    common: [
        { name: 'Малая мышь', icon: '🦇', rarity: 'common' },
        { name: 'Серая мышь', icon: '🦇', rarity: 'common' },
        { name: 'Ночная мышь', icon: '🦇', rarity: 'common' }
    ],
    uncommon: [
        { name: 'Лунная мышь', icon: '🦇', rarity: 'uncommon' },
        { name: 'Пещерная мышь', icon: '🦇', rarity: 'uncommon' },
        { name: 'Быстрая мышь', icon: '🦇', rarity: 'uncommon' }
    ],
    rare: [
        { name: 'Синяя мышь', icon: '🦇', rarity: 'rare' },
        { name: 'Ледяная мышь', icon: '❄️', rarity: 'rare' },
        { name: 'Звездная мышь', icon: '⭐', rarity: 'rare' }
    ],
    epic: [
        { name: 'Огненная мышь', icon: '🔥', rarity: 'epic' },
        { name: 'Фиолетовая мышь', icon: '💜', rarity: 'epic' },
        { name: 'Призрачная мышь', icon: '👻', rarity: 'epic' }
    ],
    legendary: [
        { name: 'Золотая мышь', icon: '✨', rarity: 'legendary' },
        { name: 'Радужная мышь', icon: '🌈', rarity: 'legendary' },
        { name: 'Космическая мышь', icon: '🌟', rarity: 'legendary' }
    ]
};

// Предметы для собирательства
const gatherableItems = [
    { icon: '💎', type: 'crystal', value: 1 },
    { icon: '🪙', type: 'coin', value: 1 },
    { icon: '💰', type: 'coin', value: 5 },
    { icon: '💠', type: 'crystal', value: 3 }
];

// Инициализация игры
function init() {
    loadGame();
    updateUI();
    startGathering();
    
    // Проверка авто-сбора
    const autoGatherBtn = document.getElementById('auto-gather-btn');
    autoGatherBtn.addEventListener('click', enableAutoGather);
    
    updateAutoGatherButton();
}

// Обновление UI
function updateUI() {
    document.getElementById('crystals').textContent = gameState.crystals;
    document.getElementById('coins').textContent = gameState.coins;
    document.getElementById('bat-count').textContent = gameState.bats.length;
    updateBatCollection();
    updateAutoGatherButton();
}

// Обновление кнопки авто-сбора
function updateAutoGatherButton() {
    const btn = document.getElementById('auto-gather-btn');
    if (gameState.autoGatherEnabled) {
        btn.textContent = '🤖 Авто-сбор (Активен)';
        btn.classList.remove('btn-disabled');
        btn.classList.add('btn-primary');
        btn.disabled = true;
    } else if (gameState.coins >= 100) {
        btn.textContent = '🤖 Авто-сбор (100 монет)';
        btn.classList.remove('btn-disabled');
        btn.classList.add('btn-primary');
        btn.disabled = false;
    } else {
        btn.textContent = '🤖 Авто-сбор (100 монет)';
        btn.classList.add('btn-disabled');
        btn.classList.remove('btn-primary');
        btn.disabled = true;
    }
}

// Включить авто-сбор
function enableAutoGather() {
    if (gameState.coins >= 100 && !gameState.autoGatherEnabled) {
        gameState.coins -= 100;
        gameState.autoGatherEnabled = true;
        updateUI();
        saveGame();
    }
}

// Система собирательства
function startGathering() {
    setInterval(() => {
        spawnGatherableItem();
    }, 2000);
}

function spawnGatherableItem() {
    const gatheringArea = document.getElementById('gathering-area');
    const item = gatherableItems[Math.floor(Math.random() * gatherableItems.length)];
    
    const itemElement = document.createElement('div');
    itemElement.className = 'gatherable-item';
    itemElement.textContent = item.icon;
    itemElement.style.left = Math.random() * 85 + '%';
    itemElement.style.top = Math.random() * 85 + '%';
    
    itemElement.addEventListener('click', () => {
        collectItem(item, itemElement);
    });
    
    gatheringArea.appendChild(itemElement);
    
    // Авто-сбор
    if (gameState.autoGatherEnabled) {
        setTimeout(() => {
            if (itemElement.parentElement) {
                collectItem(item, itemElement);
            }
        }, 1500);
    }
    
    // Удалить предмет через 5 секунд если не собран
    setTimeout(() => {
        if (itemElement.parentElement) {
            itemElement.remove();
        }
    }, 5000);
}

function collectItem(item, element) {
    // Анимация сбора
    element.style.animation = 'collect 0.5s ease-out';
    
    setTimeout(() => {
        element.remove();
    }, 500);
    
    // Добавить ресурсы
    if (item.type === 'crystal') {
        gameState.crystals += item.value;
    } else if (item.type === 'coin') {
        gameState.coins += item.value;
    }
    
    updateUI();
    saveGame();
}

// Система лутбоксов
function openLootbox(type) {
    let cost, rewards;
    
    switch(type) {
        case 'basic':
            cost = 50;
            rewards = getBasicRewards();
            break;
        case 'rare':
            cost = 150;
            rewards = getRareRewards();
            break;
        case 'epic':
            cost = 300;
            rewards = getEpicRewards();
            break;
    }
    
    if (gameState.crystals >= cost) {
        gameState.crystals -= cost;
        
        // Добавить награды
        rewards.forEach(reward => {
            if (reward.type === 'bat') {
                gameState.bats.push(reward.bat);
            } else if (reward.type === 'coins') {
                gameState.coins += reward.value;
            }
        });
        
        updateUI();
        saveGame();
        showRewardModal(rewards);
    } else {
        alert('Недостаточно кристаллов! 💎');
    }
}

// Награды из сундуков
function getBasicRewards() {
    const rewards = [];
    const random = Math.random();
    
    // 50% шанс монеты, 50% обычная мышь
    if (random < 0.5) {
        rewards.push({ type: 'coins', value: 20 });
    } else {
        const bat = batTypes.common[Math.floor(Math.random() * batTypes.common.length)];
        rewards.push({ type: 'bat', bat: { ...bat, id: Date.now() } });
    }
    
    return rewards;
}

function getRareRewards() {
    const rewards = [];
    const random = Math.random();
    
    rewards.push({ type: 'coins', value: 50 });
    
    if (random < 0.6) {
        // 60% обычная или необычная
        const rarity = random < 0.3 ? 'common' : 'uncommon';
        const bat = batTypes[rarity][Math.floor(Math.random() * batTypes[rarity].length)];
        rewards.push({ type: 'bat', bat: { ...bat, id: Date.now() } });
    } else {
        // 40% редкая
        const bat = batTypes.rare[Math.floor(Math.random() * batTypes.rare.length)];
        rewards.push({ type: 'bat', bat: { ...bat, id: Date.now() } });
    }
    
    return rewards;
}

function getEpicRewards() {
    const rewards = [];
    const random = Math.random();
    
    rewards.push({ type: 'coins', value: 100 });
    
    if (random < 0.05) {
        // 5% легендарная
        const bat = batTypes.legendary[Math.floor(Math.random() * batTypes.legendary.length)];
        rewards.push({ type: 'bat', bat: { ...bat, id: Date.now() } });
    } else if (random < 0.25) {
        // 20% эпическая
        const bat = batTypes.epic[Math.floor(Math.random() * batTypes.epic.length)];
        rewards.push({ type: 'bat', bat: { ...bat, id: Date.now() } });
    } else {
        // 75% редкая
        const bat = batTypes.rare[Math.floor(Math.random() * batTypes.rare.length)];
        rewards.push({ type: 'bat', bat: { ...bat, id: Date.now() } });
    }
    
    return rewards;
}

// Показать модальное окно с наградами
function showRewardModal(rewards) {
    const modal = document.getElementById('reward-modal');
    const rewardDisplay = document.getElementById('reward-display');
    
    rewardDisplay.innerHTML = '';
    
    rewards.forEach(reward => {
        if (reward.type === 'bat') {
            const rarityText = {
                'common': 'Обычная',
                'uncommon': 'Необычная',
                'rare': 'Редкая',
                'epic': 'Эпическая',
                'legendary': 'Легендарная'
            };
            
            rewardDisplay.innerHTML += `
                <div class="reward-item">${reward.bat.icon}</div>
                <div class="reward-text">${reward.bat.name}</div>
                <div class="reward-text" style="color: #ffd93d;">${rarityText[reward.bat.rarity]}</div>
            `;
        } else if (reward.type === 'coins') {
            rewardDisplay.innerHTML += `
                <div class="reward-item">🪙</div>
                <div class="reward-text">+${reward.value} монет</div>
            `;
        }
    });
    
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('reward-modal');
    modal.classList.remove('show');
}

// Обновить коллекцию летучих мышей
function updateBatCollection() {
    const collection = document.getElementById('bat-collection');
    
    if (gameState.bats.length === 0) {
        collection.innerHTML = '<p class="empty-message">У вас пока нет летучих мышей. Открывайте сундуки!</p>';
        return;
    }
    
    // Группировать по имени и редкости
    const batGroups = {};
    gameState.bats.forEach(bat => {
        const key = `${bat.name}_${bat.rarity}`;
        if (!batGroups[key]) {
            batGroups[key] = { ...bat, count: 0 };
        }
        batGroups[key].count++;
    });
    
    const rarityText = {
        'common': 'Обычная',
        'uncommon': 'Необычная',
        'rare': 'Редкая',
        'epic': 'Эпическая',
        'legendary': 'Легендарная'
    };
    
    collection.innerHTML = Object.values(batGroups).map(bat => `
        <div class="bat-card ${bat.rarity}">
            <div class="bat-icon">${bat.icon}</div>
            <div class="bat-name">${bat.name}</div>
            <div class="bat-rarity">${rarityText[bat.rarity]}</div>
            <div class="bat-count-badge">x${bat.count}</div>
        </div>
    `).join('');
}

// Сохранение и загрузка игры
function saveGame() {
    localStorage.setItem('batGameSave', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('batGameSave');
    if (saved) {
        const loadedState = JSON.parse(saved);
        gameState = {
            ...gameState,
            ...loadedState
        };
    }
}

// Запуск игры при загрузке страницы
window.addEventListener('load', init);
