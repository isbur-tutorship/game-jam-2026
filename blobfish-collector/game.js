// VANYA_L0X - Игра с рыбой-каплей
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Игровые переменные
        this.coins = 0;
        this.score = 0;
        this.inventory = {};
        
        // Игрок (рыба-капля)
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            width: 32,
            height: 32,
            speed: 3,
            dx: 0,
            dy: 0
        };
        
        // Собираемые объекты
        this.collectibles = [];
        this.maxCollectibles = 15;
        
        // Случайные события
        this.randomEvents = [];
        
        // Управление
        this.keys = {};
        
        // Инициализация
        this.init();
    }
    
    init() {
        this.setupControls();
        this.spawnCollectibles();
        this.gameLoop();
        this.startRandomEvents();
        this.addEvent('🎮 Игра началась! Собирай предметы и открывай лутбоксы!', 'info');
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Пробел для взаимодействия
            if (e.key === ' ') {
                e.preventDefault();
                this.interact();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    updatePlayer() {
        // Движение
        this.player.dx = 0;
        this.player.dy = 0;
        
        if (this.keys['arrowleft'] || this.keys['a']) this.player.dx = -this.player.speed;
        if (this.keys['arrowright'] || this.keys['d']) this.player.dx = this.player.speed;
        if (this.keys['arrowup'] || this.keys['w']) this.player.dy = -this.player.speed;
        if (this.keys['arrowdown'] || this.keys['s']) this.player.dy = this.player.speed;
        
        // Обновление позиции
        this.player.x += this.player.dx;
        this.player.y += this.player.dy;
        
        // Границы экрана
        this.player.x = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, this.player.x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.height - this.player.height / 2, this.player.y));
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        const w = this.player.width;
        const h = this.player.height;
        
        // Рыба-капля в пиксельном стиле
        this.ctx.save();
        
        // Тело (розовое)
        this.ctx.fillStyle = '#ffb3ba';
        this.ctx.fillRect(x - w/2, y - h/2, w, h);
        
        // Голова (светлее)
        this.ctx.fillStyle = '#ffd4d8';
        this.ctx.fillRect(x - w/2, y - h/2, w, h * 0.6);
        
        // Глаза
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - w/4, y - h/4, 6, 6);
        this.ctx.fillRect(x + w/4 - 6, y - h/4, 6, 6);
        
        // Белки глаз
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x - w/4 + 1, y - h/4 + 1, 3, 3);
        this.ctx.fillRect(x + w/4 - 4, y - h/4 + 1, 3, 3);
        
        // Рот (грустный)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 8, y + 2, 16, 3);
        this.ctx.fillRect(x - 10, y - 1, 3, 3);
        this.ctx.fillRect(x + 7, y - 1, 3, 3);
        
        // Хвост
        this.ctx.fillStyle = '#ffb3ba';
        this.ctx.fillRect(x - w/2 - 6, y + h/4, 6, 8);
        this.ctx.fillRect(x - w/2 - 10, y + h/4 + 2, 4, 4);
        
        // Плавники
        this.ctx.fillStyle = '#ff9aa2';
        this.ctx.fillRect(x - w/2 - 4, y, 4, 8);
        this.ctx.fillRect(x + w/2, y, 4, 8);
        
        this.ctx.restore();
    }
    
    spawnCollectibles() {
        while (this.collectibles.length < this.maxCollectibles) {
            const types = [
                { emoji: '💰', value: 10, name: 'Монета', rarity: 'common' },
                { emoji: '⭐', value: 5, name: 'Звезда', rarity: 'common' },
                { emoji: '💎', value: 50, name: 'Алмаз', rarity: 'rare' },
                { emoji: '🐚', value: 15, name: 'Ракушка', rarity: 'common' },
                { emoji: '🦀', value: 20, name: 'Краб', rarity: 'uncommon' },
                { emoji: '🐙', value: 30, name: 'Осьминог', rarity: 'rare' },
                { emoji: '🌊', value: 8, name: 'Волна', rarity: 'common' },
                { emoji: '🧜', value: 100, name: 'Русалка', rarity: 'legendary' }
            ];
            
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.collectibles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                width: 24,
                height: 24,
                ...type,
                collected: false,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    drawCollectibles() {
        const time = Date.now() / 1000;
        
        this.collectibles.forEach((item, index) => {
            if (item.collected) return;
            
            // Эффект плавания
            const bobY = Math.sin(time * 2 + item.bobOffset) * 3;
            
            // Проверка столкновения с игроком
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.player.width + item.width) / 2) {
                this.collectItem(item, index);
                return;
            }
            
            // Рисование
            this.ctx.save();
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Свечение для редких предметов
            if (item.rarity === 'rare') {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#4ecdc4';
            } else if (item.rarity === 'legendary') {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#f5576c';
            }
            
            this.ctx.fillText(item.emoji, item.x, item.y + bobY);
            this.ctx.restore();
        });
    }
    
    collectItem(item, index) {
        item.collected = true;
        this.coins += item.value;
        this.score += item.value * 2;
        
        // Добавление в инвентарь
        if (this.inventory[item.name]) {
            this.inventory[item.name].count++;
        } else {
            this.inventory[item.name] = {
                emoji: item.emoji,
                count: 1,
                rarity: item.rarity
            };
        }
        
        this.updateUI();
        this.addEvent(`Собрано: ${item.emoji} ${item.name} (+${item.value} 💰)`, 'collect');
        
        // Удаление собранного предмета
        setTimeout(() => {
            this.collectibles.splice(index, 1);
            this.spawnCollectibles();
        }, 100);
    }
    
    startRandomEvents() {
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.spawnRandomEvent();
            }
        }, 5000);
    }
    
    spawnRandomEvent() {
        const events = [
            { emoji: '🎁', name: 'Подарок', reward: 50 },
            { emoji: '💝', name: 'Сюрприз', reward: 30 },
            { emoji: '🎯', name: 'Бонус', reward: 20 },
            { emoji: '🌟', name: 'Звездопад', reward: 40 }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        this.randomEvents.push({
            x: Math.random() * (this.width - 40) + 20,
            y: -30,
            width: 30,
            height: 30,
            speed: 1 + Math.random() * 2,
            ...event,
            lifetime: 200
        });
        
        this.addEvent(`⚡ Случайное событие: ${event.emoji} ${event.name}!`, 'info');
    }
    
    updateRandomEvents() {
        this.randomEvents = this.randomEvents.filter(event => {
            event.y += event.speed;
            event.lifetime--;
            
            // Проверка столкновения
            const dx = this.player.x - event.x;
            const dy = this.player.y - event.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.player.width + event.width) / 2) {
                this.coins += event.reward;
                this.score += event.reward * 3;
                this.addEvent(`✨ Поймано событие! +${event.reward} 💰`, 'collect');
                this.updateUI();
                return false;
            }
            
            return event.y < this.height && event.lifetime > 0;
        });
    }
    
    drawRandomEvents() {
        this.randomEvents.forEach(event => {
            this.ctx.save();
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ffe66d';
            
            // Вращение
            const rotation = (Date.now() / 500) % (Math.PI * 2);
            this.ctx.translate(event.x, event.y);
            this.ctx.rotate(rotation);
            this.ctx.fillText(event.emoji, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawBackground() {
        // Океан
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#1a5490');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Пузыри
        const time = Date.now() / 1000;
        for (let i = 0; i < 10; i++) {
            const x = (i * 60 + time * 20) % this.width;
            const y = (i * 40 + Math.sin(time + i) * 20) % this.height;
            const size = 3 + Math.sin(time * 2 + i) * 2;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Водоросли
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const x = i * 120 + 40;
            const swing = Math.sin(time + i) * 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.height);
            this.ctx.quadraticCurveTo(
                x + swing, this.height - 50,
                x + swing * 2, this.height - 100
            );
            this.ctx.stroke();
        }
    }
    
    interact() {
        // Взаимодействие (можно расширить)
        this.addEvent('💬 Взаимодействие!', 'info');
    }
    
    openLootbox(type) {
        const prices = {
            common: 50,
            rare: 150,
            legendary: 500
        };
        
        const price = prices[type];
        
        if (this.coins < price) {
            this.addEvent('❌ Недостаточно монет!', 'info');
            return;
        }
        
        this.coins -= price;
        this.updateUI();
        
        const rewards = this.generateLootboxRewards(type);
        this.showRewardModal(rewards);
        
        this.addEvent(`📦 Открыт ${type} лутбокс!`, 'lootbox');
    }
    
    generateLootboxRewards(type) {
        const rewards = [];
        const rewardTypes = {
            common: [
                { emoji: '💰', name: 'Монеты', min: 20, max: 50 },
                { emoji: '⭐', name: 'Звёзды', min: 10, max: 30 },
                { emoji: '🐚', name: 'Ракушка', min: 1, max: 3 }
            ],
            rare: [
                { emoji: '💎', name: 'Алмазы', min: 50, max: 100 },
                { emoji: '🦀', name: 'Золотой краб', min: 1, max: 2 },
                { emoji: '🐙', name: 'Осьминог', min: 1, max: 3 },
                { emoji: '🎁', name: 'Подарок', min: 30, max: 80 }
            ],
            legendary: [
                { emoji: '👑', name: 'Корона', min: 1, max: 1 },
                { emoji: '🧜', name: 'Русалка', min: 100, max: 200 },
                { emoji: '🔱', name: 'Трезубец', min: 1, max: 1 },
                { emoji: '💎', name: 'Бриллианты', min: 200, max: 500 },
                { emoji: '🌟', name: 'Легендарная звезда', min: 1, max: 1 }
            ]
        };
        
        const itemCount = type === 'common' ? 3 : type === 'rare' ? 5 : 7;
        const pool = rewardTypes[type];
        
        for (let i = 0; i < itemCount; i++) {
            const item = pool[Math.floor(Math.random() * pool.length)];
            const amount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
            
            rewards.push({
                emoji: item.emoji,
                name: item.name,
                amount: amount
            });
            
            // Добавление в инвентарь
            if (this.inventory[item.name]) {
                this.inventory[item.name].count += amount;
            } else {
                this.inventory[item.name] = {
                    emoji: item.emoji,
                    count: amount,
                    rarity: type
                };
            }
            
            // Добавление монет/очков
            this.coins += amount;
            this.score += amount * 5;
        }
        
        this.updateUI();
        return rewards;
    }
    
    showRewardModal(rewards) {
        const modal = document.getElementById('reward-modal');
        const display = document.getElementById('reward-display');
        
        display.innerHTML = '';
        rewards.forEach(reward => {
            const div = document.createElement('div');
            div.className = 'reward-item';
            div.innerHTML = `
                ${reward.emoji}
                <span class="reward-name">${reward.name} x${reward.amount}</span>
            `;
            display.appendChild(div);
        });
        
        modal.style.display = 'block';
    }
    
    closeRewardModal() {
        document.getElementById('reward-modal').style.display = 'none';
    }
    
    updateUI() {
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('score').textContent = this.score;
        
        // Обновление инвентаря
        const inventoryDiv = document.getElementById('inventory');
        inventoryDiv.innerHTML = '';
        
        let itemCount = 0;
        for (let [name, data] of Object.entries(this.inventory)) {
            itemCount += data.count;
            
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                ${data.emoji}
                <span class="item-count">${data.count}</span>
                <span class="item-rarity">${name}</span>
            `;
            inventoryDiv.appendChild(div);
        }
        
        document.getElementById('items-count').textContent = itemCount;
    }
    
    addEvent(message, type = 'info') {
        const log = document.getElementById('event-log');
        const event = document.createElement('div');
        event.className = `event ${type}`;
        
        const time = new Date().toLocaleTimeString('ru-RU');
        event.textContent = `[${time}] ${message}`;
        
        log.insertBefore(event, log.firstChild);
        
        // Ограничение количества событий
        while (log.children.length > 10) {
            log.removeChild(log.lastChild);
        }
    }
    
    gameLoop() {
        this.updatePlayer();
        this.updateRandomEvents();
        
        this.drawBackground();
        this.drawCollectibles();
        this.drawRandomEvents();
        this.drawPlayer();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Запуск игры
let game;
window.addEventListener('load', () => {
    game = new Game();
});

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('reward-modal');
    if (event.target === modal) {
        game.closeRewardModal();
    }
}
