class Game {
    constructor() {
        this.coins = 0;
        this.clickPower = 1;
        this.autoClickPower = 0;
        this.activeBuffs = [];
        this.collection = [];
        
        // Предметы коллекции
        this.collectibles = [
            { id: 1, name: 'Монета', emoji: '🪙', rarity: 'Обычный', chance: 30 },
            { id: 2, name: 'Гем', emoji: '💎', rarity: 'Редкий', chance: 15 },
            { id: 3, name: 'Корона', emoji: '👑', rarity: 'Эпический', chance: 8 },
            { id: 4, name: 'Звезда', emoji: '⭐', rarity: 'Редкий', chance: 12 },
            { id: 5, name: 'Кристалл', emoji: '💠', rarity: 'Эпический', chance: 7 },
            { id: 6, name: 'Трофей', emoji: '🏆', rarity: 'Легендарный', chance: 3 },
            { id: 7, name: 'Ключ', emoji: '🗝️', rarity: 'Редкий', chance: 10 },
            { id: 8, name: 'Зелье', emoji: '🧪', rarity: 'Обычный', chance: 25 },
            { id: 9, name: 'Меч', emoji: '⚔️', rarity: 'Эпический', chance: 6 },
            { id: 10, name: 'Магия', emoji: '✨', rarity: 'Редкий', chance: 11 },
            { id: 11, name: 'Дракон', emoji: '🐉', rarity: 'Легендарный', chance: 2 },
            { id: 12, name: 'Феникс', emoji: '🔥', rarity: 'Мифический', chance: 1 }
        ];
        
        // Улучшения в магазине
        this.shopItems = [
            { id: 1, name: 'Помощник', emoji: '👷', baseCost: 10, owned: 0, effect: 1, type: 'auto', desc: '+1 монета/сек' },
            { id: 2, name: 'Робот', emoji: '🤖', baseCost: 100, owned: 0, effect: 5, type: 'auto', desc: '+5 монет/сек' },
            { id: 3, name: 'Фабрика', emoji: '🏭', baseCost: 500, owned: 0, effect: 20, type: 'auto', desc: '+20 монет/сек' },
            { id: 4, name: 'Портал', emoji: '🌀', baseCost: 2000, owned: 0, effect: 100, type: 'auto', desc: '+100 монет/сек' },
            { id: 5, name: 'Усилитель клика', emoji: '💪', baseCost: 50, owned: 0, effect: 1, type: 'click', desc: '+1 к силе клика' },
            { id: 6, name: 'Золотая рука', emoji: '🖐️', baseCost: 300, owned: 0, effect: 5, type: 'click', desc: '+5 к силе клика' }
        ];
        
        // Возможные бафы
        this.buffTypes = [
            { id: 1, name: 'Двойные монеты', emoji: '💰', duration: 10, effect: 'doubleCoins' },
            { id: 2, name: 'Мега клик', emoji: '⚡', duration: 15, effect: 'megaClick' },
            { id: 3, name: 'Ускорение', emoji: '🚀', duration: 20, effect: 'speedBoost' },
            { id: 4, name: 'Удача', emoji: '🍀', duration: 30, effect: 'luck' },
            { id: 5, name: 'Золотая лихорадка', emoji: '💛', duration: 8, effect: 'goldRush' }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderShop();
        this.renderCollection();
        this.startAutoClicker();
        this.startRandomBuffs();
        this.updateUI();
    }
    
    setupEventListeners() {
        document.getElementById('clickButton').addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleClick(e) {
        let coinsEarned = this.clickPower;
        
        // Применяем бафы
        if (this.hasActiveBuff('doubleCoins') || this.hasActiveBuff('goldRush')) {
            coinsEarned *= 2;
        }
        if (this.hasActiveBuff('megaClick')) {
            coinsEarned *= 3;
        }
        
        this.coins += coinsEarned;
        
        // Визуальный эффект
        this.createFloatingText(`+${coinsEarned}`, e.clientX, e.clientY);
        
        // Шанс получить предмет коллекции
        this.tryUnlockCollectible();
        
        this.updateUI();
    }
    
    createFloatingText(text, x, y) {
        const floatText = document.createElement('div');
        floatText.className = 'float-text';
        floatText.textContent = text;
        floatText.style.left = x + 'px';
        floatText.style.top = y + 'px';
        
        document.getElementById('clickEffects').appendChild(floatText);
        
        setTimeout(() => floatText.remove(), 1000);
    }
    
    tryUnlockCollectible() {
        const luckBoost = this.hasActiveBuff('luck') ? 2 : 1;
        
        for (const item of this.collectibles) {
            if (!this.collection.includes(item.id)) {
                const chance = item.chance * luckBoost;
                if (Math.random() * 100 < chance / 100) {
                    this.unlockCollectible(item.id);
                    break;
                }
            }
        }
    }
    
    unlockCollectible(id) {
        if (!this.collection.includes(id)) {
            this.collection.push(id);
            const item = this.collectibles.find(i => i.id === id);
            this.showNotification(`🎉 Получен: ${item.emoji} ${item.name}!`);
            this.renderCollection();
        }
    }
    
    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffd700;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.remove(), 3000);
    }
    
    buyItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        const cost = this.getItemCost(item);
        
        if (this.coins >= cost) {
            this.coins -= cost;
            item.owned++;
            
            if (item.type === 'auto') {
                this.autoClickPower += item.effect;
            } else if (item.type === 'click') {
                this.clickPower += item.effect;
            }
            
            this.updateUI();
            this.renderShop();
        }
    }
    
    getItemCost(item) {
        return Math.floor(item.baseCost * Math.pow(1.15, item.owned));
    }
    
    startAutoClicker() {
        setInterval(() => {
            if (this.autoClickPower > 0) {
                let earnings = this.autoClickPower;
                
                if (this.hasActiveBuff('speedBoost')) {
                    earnings *= 1.5;
                }
                if (this.hasActiveBuff('goldRush')) {
                    earnings *= 2;
                }
                
                this.coins += earnings;
                this.updateUI();
            }
        }, 1000);
    }
    
    startRandomBuffs() {
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% шанс каждые 20 секунд
                this.addRandomBuff();
            }
        }, 20000);
    }
    
    addRandomBuff() {
        const buffType = this.buffTypes[Math.floor(Math.random() * this.buffTypes.length)];
        const buff = {
            ...buffType,
            endTime: Date.now() + (buffType.duration * 1000)
        };
        
        this.activeBuffs.push(buff);
        this.showNotification(`✨ Баф: ${buff.emoji} ${buff.name}!`);
        this.updateBuffs();
        
        setTimeout(() => {
            this.activeBuffs = this.activeBuffs.filter(b => b.endTime > Date.now());
            this.updateBuffs();
        }, buffType.duration * 1000);
    }
    
    hasActiveBuff(effect) {
        return this.activeBuffs.some(buff => buff.effect === effect && buff.endTime > Date.now());
    }
    
    updateBuffs() {
        const buffsList = document.getElementById('buffsList');
        buffsList.innerHTML = '';
        
        this.activeBuffs.forEach(buff => {
            if (buff.endTime > Date.now()) {
                const buffEl = document.createElement('div');
                buffEl.className = 'buff-item';
                
                const timeLeft = Math.ceil((buff.endTime - Date.now()) / 1000);
                buffEl.innerHTML = `
                    <span>${buff.emoji} ${buff.name}</span>
                    <span class="buff-timer">${timeLeft}s</span>
                `;
                buffsList.appendChild(buffEl);
            }
        });
        
        // Обновляем таймеры каждую секунду
        setTimeout(() => this.updateBuffs(), 1000);
    }
    
    renderShop() {
        const shopItems = document.getElementById('shopItems');
        shopItems.innerHTML = '';
        
        this.shopItems.forEach(item => {
            const cost = this.getItemCost(item);
            const canBuy = this.coins >= cost;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.emoji} ${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    <div class="shop-item-count">Куплено: ${item.owned}</div>
                </div>
                <button ${!canBuy ? 'disabled' : ''}>
                    💰 ${cost}
                </button>
            `;
            
            itemEl.querySelector('button').addEventListener('click', () => this.buyItem(item.id));
            shopItems.appendChild(itemEl);
        });
    }
    
    renderCollection() {
        const grid = document.getElementById('collectionGrid');
        grid.innerHTML = '';
        
        this.collectibles.forEach(item => {
            const unlocked = this.collection.includes(item.id);
            const itemEl = document.createElement('div');
            itemEl.className = `collection-item ${unlocked ? 'unlocked' : 'locked'}`;
            itemEl.innerHTML = `
                <span class="collection-item-emoji">${unlocked ? item.emoji : '❓'}</span>
                <div class="collection-item-name">${unlocked ? item.name : '???'}</div>
                <div class="collection-item-rarity">${unlocked ? item.rarity : '???'}</div>
            `;
            grid.appendChild(itemEl);
        });
        
        document.getElementById('collectionCount').textContent = this.collection.length;
    }
    
    updateUI() {
        document.getElementById('coins').textContent = Math.floor(this.coins);
        document.getElementById('perClick').textContent = this.clickPower;
        document.getElementById('perSecond').textContent = this.autoClickPower.toFixed(1);
        this.renderShop();
    }
}

// Запускаем игру
const game = new Game();