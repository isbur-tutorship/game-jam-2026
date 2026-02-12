// 3D Зомби Шутер с магической рукой, BMW и музыкой Mashery
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Установка размера canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Игровое состояние
let gameStarted = false;
let gameOver = false;
let isPointerLocked = false;

// Игрок
const player = {
    x: 0,
    y: 0,
    z: 0,
    angle: 0,
    angleV: 0,
    health: 100,
    speed: 0.08,
    height: 0.5,
    isMoving: false,
    walkCycle: 0,
    bobAmount: 0.03,
    bobSpeed: 0.15
};

// Магическая рука
const hand = {
    energy: 100,
    maxEnergy: 100,
    energyRegen: 8,
    pellets: 5,
    spread: 0.2,
    damage: 30,
    range: 20,
    shootCooldown: 0,
    shootDelay: 300,
    energyCost: 10
};

// Управление
const keys = {};
let mouseMovementX = 0;
let mouseMovementY = 0;

// Игровые объекты
let zombies = [];
let particles = [];
let bloodSplatters = [];
let muzzleFlash = null;
let objects = [];
let cars = [];

// Игровая статистика
let kills = 0;
let wave = 1;
let zombiesInWave = 5;
let zombiesSpawned = 0;

// Музыка
let audioContext;
let musicPlaying = false;
let bassFrequency = 0;

// Класс BMW
class Car {
    constructor(x, z, angle = 0) {
        this.x = x;
        this.y = 0;
        this.z = z;
        this.angle = angle;
        this.size = 1.5;
        this.color = ['#000000', '#ff0000', '#0066cc', '#ffffff', '#ffcc00'][Math.floor(Math.random() * 5)];
    }
    
    draw() {
        const dx = this.x - player.x;
        const dz = this.z - player.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 0.1 || distance > 30) return;
        
        const angle = Math.atan2(dz, dx) - player.angle;
        if (Math.abs(angle) > Math.PI / 2) return;
        
        const screenX = canvas.width / 2 + Math.tan(angle) * canvas.width;
        const scale = (canvas.height / distance) * 0.8;
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(screenX - scale * 0.9, canvas.height / 2 + scale * 0.7, scale * 1.8, scale * 0.3);
        
        // Корпус
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - scale * 0.8, canvas.height / 2 - scale * 0.3, scale * 1.6, scale * 0.9);
        
        // Крыша
        ctx.fillRect(screenX - scale * 0.5, canvas.height / 2 - scale * 0.8, scale, scale * 0.5);
        
        // Окна
        ctx.fillStyle = 'rgba(100, 150, 200, 0.5)';
        ctx.fillRect(screenX - scale * 0.45, canvas.height / 2 - scale * 0.75, scale * 0.4, scale * 0.4);
        ctx.fillRect(screenX + scale * 0.05, canvas.height / 2 - scale * 0.75, scale * 0.4, scale * 0.4);
        
        // Фары
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX - scale * 0.75, canvas.height / 2 - scale * 0.1, scale * 0.2, scale * 0.15);
        ctx.fillRect(screenX + scale * 0.55, canvas.height / 2 - scale * 0.1, scale * 0.2, scale * 0.15);
        
        // Колеса
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(screenX - scale * 0.5, canvas.height / 2 + scale * 0.5, scale * 0.2, 0, Math.PI * 2);
        ctx.arc(screenX + scale * 0.5, canvas.height / 2 + scale * 0.5, scale * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Диски
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(screenX - scale * 0.5, canvas.height / 2 + scale * 0.5, scale * 0.12, 0, Math.PI * 2);
        ctx.arc(screenX + scale * 0.5, canvas.height / 2 + scale * 0.5, scale * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Логотип BMW
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, canvas.height / 2, scale * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(screenX - scale * 0.15, canvas.height / 2 - scale * 0.15, scale * 0.15, scale * 0.15);
        ctx.fillRect(screenX, canvas.height / 2, scale * 0.15, scale * 0.15);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX, canvas.height / 2 - scale * 0.15, scale * 0.15, scale * 0.15);
        ctx.fillRect(screenX - scale * 0.15, canvas.height / 2, scale * 0.15, scale * 0.15);
    }
}

// Класс объектов (деревья, камни, здания)
class MapObject {
    constructor(x, z, type) {
        this.x = x;
        this.y = 0;
        this.z = z;
        this.type = type;
        this.size = type === 'building' ? 3 : type === 'tree' ? 1 : 0.5;
        this.height = type === 'building' ? 4 : type === 'tree' ? 2 : 0.5;
    }
    
    draw() {
        const dx = this.x - player.x;
        const dz = this.z - player.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 0.1 || distance > 30) return;
        
        const angle = Math.atan2(dz, dx) - player.angle;
        if (Math.abs(angle) > Math.PI / 2) return;
        
        const screenX = canvas.width / 2 + Math.tan(angle) * canvas.width;
        const scale = (canvas.height / distance) * 0.5;
        
        if (this.type === 'tree') {
            // Ствол
            ctx.fillStyle = '#654321';
            ctx.fillRect(screenX - scale * 0.2, canvas.height / 2 - scale, scale * 0.4, scale * 2);
            
            // Крона
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(screenX, canvas.height / 2 - scale * 1.5, scale * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2d5016';
            ctx.beginPath();
            ctx.arc(screenX - scale * 0.3, canvas.height / 2 - scale * 1.3, scale * 0.5, 0, Math.PI * 2);
            ctx.arc(screenX + scale * 0.3, canvas.height / 2 - scale * 1.3, scale * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'rock') {
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(screenX, canvas.height / 2 + scale * 0.3, scale * 0.8, 0, Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#505050';
            ctx.fillRect(screenX - scale * 0.6, canvas.height / 2, scale * 1.2, scale * 0.6);
        } else if (this.type === 'building') {
            // Здание
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - scale * 1.5, canvas.height / 2 - scale * 3, scale * 3, scale * 3.5);
            
            // Крыша
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.moveTo(screenX - scale * 1.7, canvas.height / 2 - scale * 3);
            ctx.lineTo(screenX, canvas.height / 2 - scale * 4);
            ctx.lineTo(screenX + scale * 1.7, canvas.height / 2 - scale * 3);
            ctx.closePath();
            ctx.fill();
            
            // Окна
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    ctx.fillRect(
                        screenX - scale * 1.2 + i * scale * 0.8,
                        canvas.height / 2 - scale * 2.5 + j * scale * 0.8,
                        scale * 0.4,
                        scale * 0.5
                    );
                }
            }
            
            // Дверь
            ctx.fillStyle = '#4a2511';
            ctx.fillRect(screenX - scale * 0.3, canvas.height / 2 - scale * 0.8, scale * 0.6, scale * 0.8);
        }
    }
}

// Класс Зомби
class Zombie {
    constructor(x, z) {
        this.x = x;
        this.y = 0;
        this.z = z;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 0.03;
        this.size = 0.4;
        this.attackRange = 1.5;
        this.attackCooldown = 0;
        this.attackDelay = 1000;
        this.color = `rgb(${Math.floor(Math.random() * 50 + 50)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 50)})`;
        this.isDead = false;
        this.deathTimer = 0;
    }
    
    update(deltaTime) {
        if (this.isDead) {
            this.deathTimer += deltaTime;
            return this.deathTimer > 2000;
        }
        
        const dx = player.x - this.x;
        const dz = player.z - this.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > this.attackRange) {
            this.x += (dx / distance) * this.speed;
            this.z += (dz / distance) * this.speed;
        } else {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 0) {
                player.health -= 10;
                this.attackCooldown = this.attackDelay;
                
                if (player.health <= 0) {
                    endGame();
                }
            }
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            kills++;
            createBloodSplatter(this.x, this.z);
            
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(this.x, this.y + 0.5, this.z, 'blood'));
            }
        }
    }
    
    draw() {
        const dx = this.x - player.x;
        const dz = this.z - player.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 0.1) return;
        
        const angle = Math.atan2(dz, dx) - player.angle;
        if (Math.abs(angle) > Math.PI / 2) return;
        
        const screenX = canvas.width / 2 + Math.tan(angle) * canvas.width;
        const scale = (canvas.height / distance) * 0.5;
        
        if (this.isDead) {
            const fadeAlpha = Math.max(0, 1 - this.deathTimer / 2000);
            ctx.globalAlpha = fadeAlpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX - scale * 0.5, canvas.height / 2 + scale * 0.3, scale, scale * 0.3);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX - scale * 0.4, canvas.height / 2 - scale, scale * 0.8, scale * 2);
            
            ctx.fillStyle = '#556B2F';
            ctx.beginPath();
            ctx.arc(screenX, canvas.height / 2 - scale * 1.3, scale * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(screenX - scale * 0.1, canvas.height / 2 - scale * 1.3, scale * 0.08, 0, Math.PI * 2);
            ctx.arc(screenX + scale * 0.1, canvas.height / 2 - scale * 1.3, scale * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            const armSwing = Math.sin(Date.now() / 200) * 0.2;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = scale * 0.15;
            ctx.beginPath();
            ctx.moveTo(screenX - scale * 0.4, canvas.height / 2 - scale * 0.5);
            ctx.lineTo(screenX - scale * 0.6, canvas.height / 2 + armSwing * scale);
            ctx.moveTo(screenX + scale * 0.4, canvas.height / 2 - scale * 0.5);
            ctx.lineTo(screenX + scale * 0.6, canvas.height / 2 - armSwing * scale);
            ctx.stroke();
            
            const healthBarWidth = scale * 0.8;
            const healthPercentage = this.health / this.maxHealth;
            ctx.fillStyle = '#222';
            ctx.fillRect(screenX - healthBarWidth / 2, canvas.height / 2 - scale * 1.7, healthBarWidth, 5);
            ctx.fillStyle = healthPercentage > 0.5 ? '#0f0' : healthPercentage > 0.25 ? '#ff0' : '#f00';
            ctx.fillRect(screenX - healthBarWidth / 2, canvas.height / 2 - scale * 1.7, healthBarWidth * healthPercentage, 5);
        }
    }
}

// Класс Частицы
class Particle {
    constructor(x, y, z, type = 'blood') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = Math.random() * 0.05 + 0.02;
        this.vz = (Math.random() - 0.5) * 0.05;
        this.life = 1;
        this.type = type;
        this.size = Math.random() * 3 + 2;
        this.color = type === 'blood' ? `rgb(${Math.floor(Math.random() * 50 + 150)}, 0, 0)` : '#00ffff';
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy -= 0.002;
        this.life -= deltaTime / 1000;
        return this.life <= 0;
    }
    
    draw() {
        const dx = this.x - player.x;
        const dz = this.z - player.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 0.1) return;
        
        const angle = Math.atan2(dz, dx) - player.angle;
        if (Math.abs(angle) > Math.PI / 2) return;
        
        const screenX = canvas.width / 2 + Math.tan(angle) * canvas.width;
        const dy = this.y - player.y - player.height;
        const screenY = canvas.height / 2 - (dy / distance) * canvas.height;
        
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / distance, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createBloodSplatter(x, z) {
    bloodSplatters.push({
        x: x,
        z: z,
        size: Math.random() * 0.5 + 0.3,
        alpha: 0.7
    });
}

// Генерация карты
function generateMap() {
    objects = [];
    cars = [];
    
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 20;
        objects.push(new MapObject(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            'tree'
        ));
    }
    
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 18;
        objects.push(new MapObject(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            'rock'
        ));
    }
    
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 15;
        objects.push(new MapObject(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            'building'
        ));
    }
    
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 20;
        cars.push(new Car(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            Math.random() * Math.PI * 2
        ));
    }
}

// Музыка Mashery
function initMusic() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        startMasheryMusic();
    } catch (e) {
        console.log('Web Audio API не поддерживается');
    }
}

function startMasheryMusic() {
    if (!audioContext || musicPlaying) return;
    musicPlaying = true;
    
    const playBass = () => {
        if (!musicPlaying) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 10;
        
        const bassNotes = [40, 40, 43, 40, 38, 38, 40, 43];
        const noteIndex = Math.floor((audioContext.currentTime * 2) % bassNotes.length);
        bassFrequency = 27.5 * Math.pow(2, (bassNotes[noteIndex] - 21) / 12);
        
        oscillator.frequency.value = bassFrequency;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        setTimeout(playBass, 250);
    };
    
    const playKick = () => {
        if (!musicPlaying) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        setTimeout(playKick, 500);
    };
    
    const playHihat = () => {
        if (!musicPlaying) return;
        
        const bufferSize = audioContext.sampleRate * 0.05;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 5));
        }
        
        const noise = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        
        noise.buffer = buffer;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        noise.start(audioContext.currentTime);
        
        setTimeout(playHihat, 125);
    };
    
    playBass();
    playKick();
    playHihat();
}

function stopMusic() {
    musicPlaying = false;
}

function shootHand() {
    if (hand.energy < hand.energyCost || hand.shootCooldown > 0) {
        return;
    }
    
    hand.energy -= hand.energyCost;
    hand.shootCooldown = hand.shootDelay;
    
    muzzleFlash = { timer: 100 };
    
    for (let i = 0; i < hand.pellets; i++) {
        const spreadAngle = player.angle + (Math.random() - 0.5) * hand.spread;
        const spreadAngleV = player.angleV + (Math.random() - 0.5) * hand.spread * 0.5;
        
        shootEnergyBall(spreadAngle, spreadAngleV);
    }
    
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(
            player.x + Math.cos(player.angle) * 0.5,
            player.y + player.height,
            player.z + Math.sin(player.angle) * 0.5,
            'muzzle'
        ));
    }
    
    updateUI();
}

function shootEnergyBall(angle, angleV) {
    const maxDistance = hand.range;
    const steps = 50;
    const stepSize = maxDistance / steps;
    
    for (let i = 0; i < steps; i++) {
        const distance = i * stepSize;
        const bulletX = player.x + Math.cos(angle) * distance;
        const bulletZ = player.z + Math.sin(angle) * distance;
        const bulletY = player.y + player.height + Math.tan(angleV) * distance;
        
        for (let zombie of zombies) {
            if (zombie.isDead) continue;
            
            const dx = bulletX - zombie.x;
            const dz = bulletZ - zombie.z;
            const dy = bulletY - (zombie.y + zombie.size);
            const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
            
            if (dist < zombie.size) {
                const distanceFactor = 1 - (distance / maxDistance);
                const damage = hand.damage * distanceFactor;
                zombie.takeDamage(damage);
                
                for (let j = 0; j < 5; j++) {
                    particles.push(new Particle(bulletX, bulletY, bulletZ, 'blood'));
                }
                return;
            }
        }
    }
}

function regenerateEnergy(deltaTime) {
    if (hand.energy < hand.maxEnergy) {
        hand.energy = Math.min(hand.maxEnergy, hand.energy + (hand.energyRegen * deltaTime / 1000));
        updateUI();
    }
}

function spawnZombie() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 5;
    const x = player.x + Math.cos(angle) * distance;
    const z = player.z + Math.sin(angle) * distance;
    
    zombies.push(new Zombie(x, z));
}

function spawnWave() {
    zombiesSpawned = 0;
    const spawnInterval = setInterval(() => {
        if (zombiesSpawned < zombiesInWave) {
            spawnZombie();
            zombiesSpawned++;
        } else {
            clearInterval(spawnInterval);
        }
    }, 1000);
}

function drawWorld() {
    const headBobOffset = player.isMoving ? Math.sin(player.walkCycle * 2) * 5 : 0;
    const musicPulse = musicPlaying ? Math.sin(bassFrequency / 50) * 10 : 0;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    gradient.addColorStop(0, `rgb(${26 + musicPulse}, ${26 + musicPulse}, ${46 + musicPulse})`);
    gradient.addColorStop(1, `rgb(${15 + musicPulse}, ${52 + musicPulse}, ${96 + musicPulse})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, headBobOffset, canvas.width, canvas.height / 2);
    
    const groundGradient = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height);
    groundGradient.addColorStop(0, '#2d4a2e');
    groundGradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height / 2 + headBobOffset, canvas.width, canvas.height / 2);
    
    ctx.strokeStyle = 'rgba(100, 150, 100, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = -10; i <= 10; i++) {
        const z = i - (player.z % 1);
        const screenY = canvas.height / 2 + (canvas.height / 2) / (z || 0.1);
        
        if (screenY > canvas.height / 2 && screenY < canvas.height) {
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(canvas.width, screenY);
            ctx.stroke();
        }
    }
    
    for (let splatter of bloodSplatters) {
        const dx = splatter.x - player.x;
        const dz = splatter.z - player.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 0.1 || distance > 20) continue;
        
        const angle = Math.atan2(dz, dx) - player.angle;
        if (Math.abs(angle) > Math.PI / 2) continue;
        
        const screenX = canvas.width / 2 + Math.tan(angle) * canvas.width;
        const screenY = canvas.height / 2 + (canvas.height / 2) / distance;
        const size = (splatter.size / distance) * canvas.height;
        
        ctx.globalAlpha = splatter.alpha;
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawHand() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const walkBobX = player.isMoving ? Math.sin(player.walkCycle) * 15 : 0;
    const walkBobY = player.isMoving ? Math.abs(Math.sin(player.walkCycle * 2)) * 10 : 0;
    const recoil = hand.shootCooldown > hand.shootDelay - 100 ? -30 : 0;
    
    const handX = centerX + 200 + walkBobX;
    const handY = centerY + 200 + walkBobY + recoil;
    
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX + 300, canvas.height + 50);
    ctx.lineTo(handX + 30, handY);
    ctx.stroke();
    
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(handX, handY, 60, 0, Math.PI * 2);
    ctx.fill();
    
    const fingerPositions = [
        {angle: -0.6, length: 70},
        {angle: -0.3, length: 80},
        {angle: 0, length: 85},
        {angle: 0.3, length: 80},
        {angle: 0.6, length: 60}
    ];
    
    fingerPositions.forEach(finger => {
        const fingerX = handX + Math.cos(finger.angle - Math.PI / 4) * 60;
        const fingerY = handY + Math.sin(finger.angle - Math.PI / 4) * 60;
        const fingerEndX = fingerX + Math.cos(finger.angle - Math.PI / 4) * finger.length;
        const fingerEndY = fingerY + Math.sin(finger.angle - Math.PI / 4) * finger.length;
        
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fingerX, fingerY);
        ctx.lineTo(fingerEndX, fingerEndY);
        ctx.stroke();
        
        ctx.fillStyle = '#c49464';
        ctx.beginPath();
        ctx.arc(fingerEndX, fingerEndY, 12, 0, Math.PI * 2);
        ctx.fill();
    });
    
    const energyLevel = hand.energy / hand.maxEnergy;
    if (energyLevel > 0.3) {
        const glowSize = 80 + Math.sin(Date.now() / 200) * 10;
        const gradient = ctx.createRadialGradient(handX, handY, 0, handX, handY, glowSize);
        gradient.addColorStop(0, `rgba(0, 200, 255, ${energyLevel * 0.3})`);
        gradient.addColorStop(0.5, `rgba(0, 150, 255, ${energyLevel * 0.2})`);
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(handX, handY, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (muzzleFlash && muzzleFlash.timer > 0) {
        const alpha = muzzleFlash.timer / 100;
        
        const flashGradient = ctx.createRadialGradient(handX, handY, 0, handX, handY, 100);
        flashGradient.addColorStop(0, `rgba(0, 255, 255, ${alpha})`);
        flashGradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.5})`);
        flashGradient.addColorStop(1, `rgba(0, 150, 255, 0)`);
        
        ctx.fillStyle = flashGradient;
        ctx.beginPath();
        ctx.arc(handX, handY, 100, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const sparkAngle = (Math.PI * 2 / 8) * i + Date.now() / 100;
            const sparkDist = 60 + Math.random() * 40;
            const sparkX = handX + Math.cos(sparkAngle) * sparkDist;
            const sparkY = handY + Math.sin(sparkAngle) * sparkDist;
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(handX, handY);
            ctx.lineTo(sparkX, sparkY);
            ctx.stroke();
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function updateUI() {
    document.getElementById('health').textContent = Math.max(0, Math.floor(player.health));
    document.getElementById('kills').textContent = kills;
    document.getElementById('wave').textContent = wave;
    
    const ammoDisplay = document.getElementById('ammoDisplay');
    const energyPercent = Math.floor(hand.energy);
    document.getElementById('ammo').textContent = energyPercent;
    
    if (hand.energy < 30) {
        ammoDisplay.classList.add('low-ammo');
    } else {
        ammoDisplay.classList.remove('low-ammo');
    }
}

let lastTime = Date.now();

function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (!gameStarted || gameOver) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    player.isMoving = false;
    
    if (keys['w'] || keys['W']) {
        player.x += Math.cos(player.angle) * player.speed;
        player.z += Math.sin(player.angle) * player.speed;
        player.isMoving = true;
    }
    if (keys['s'] || keys['S']) {
        player.x -= Math.cos(player.angle) * player.speed;
        player.z -= Math.sin(player.angle) * player.speed;
        player.isMoving = true;
    }
    if (keys['a'] || keys['A']) {
        player.x += Math.cos(player.angle - Math.PI / 2) * player.speed;
        player.z += Math.sin(player.angle - Math.PI / 2) * player.speed;
        player.isMoving = true;
    }
    if (keys['d'] || keys['D']) {
        player.x += Math.cos(player.angle + Math.PI / 2) * player.speed;
        player.z += Math.sin(player.angle + Math.PI / 2) * player.speed;
        player.isMoving = true;
    }
    
    if (player.isMoving) {
        player.walkCycle += player.bobSpeed;
        player.height = 0.5 + Math.sin(player.walkCycle * 2) * player.bobAmount;
    } else {
        player.height += (0.5 - player.height) * 0.1;
        player.walkCycle = 0;
    }
    
    player.angle += mouseMovementX * 0.002;
    player.angleV = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.angleV + mouseMovementY * 0.002));
    mouseMovementX = 0;
    mouseMovementY = 0;
    
    regenerateEnergy(deltaTime);
    
    if (hand.shootCooldown > 0) {
        hand.shootCooldown -= deltaTime;
    }
    
    if (muzzleFlash) {
        muzzleFlash.timer -= deltaTime;
        if (muzzleFlash.timer <= 0) {
            muzzleFlash = null;
        }
    }
    
    zombies = zombies.filter(zombie => {
        const shouldRemove = zombie.update(deltaTime);
        return !shouldRemove;
    });
    
    particles = particles.filter(particle => {
        const shouldRemove = particle.update(deltaTime);
        return !shouldRemove;
    });
    
    if (zombies.length === 0 && zombiesSpawned >= zombiesInWave) {
        wave++;
        zombiesInWave = Math.floor(5 + wave * 2.5);
        spawnWave();
        hand.energy = hand.maxEnergy;
    }
    
    drawWorld();
    
    const allDrawables = [
        ...objects.map(obj => ({ obj, dist: Math.sqrt((obj.x - player.x) ** 2 + (obj.z - player.z) ** 2) })),
        ...cars.map(car => ({ obj: car, dist: Math.sqrt((car.x - player.x) ** 2 + (car.z - player.z) ** 2) })),
        ...zombies.map(zombie => ({ obj: zombie, dist: Math.sqrt((zombie.x - player.x) ** 2 + (zombie.z - player.z) ** 2) })),
        ...particles.map(particle => ({ obj: particle, dist: Math.sqrt((particle.x - player.x) ** 2 + (particle.z - player.z) ** 2) }))
    ];
    
    allDrawables.sort((a, b) => b.dist - a.dist);
    allDrawables.forEach(item => item.obj.draw());
    
    drawHand();
    
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    stopMusic();
    document.getElementById('finalKills').textContent = kills;
    document.getElementById('finalWave').textContent = wave;
    document.getElementById('gameOver').style.display = 'block';
    document.exitPointerLock();
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameStarted = true;
    gameOver = false;
    
    player.health = 100;
    player.x = 0;
    player.y = 0;
    player.z = 0;
    player.angle = 0;
    player.angleV = 0;
    
    hand.energy = hand.maxEnergy;
    hand.shootCooldown = 0;
    
    kills = 0;
    wave = 1;
    zombiesInWave = 5;
    zombies = [];
    particles = [];
    bloodSplatters = [];
    
    generateMap();
    initMusic();
    spawnWave();
    
    canvas.requestPointerLock();
}

document.getElementById('startBtn').addEventListener('click', startGame);

document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    startGame();
});

canvas.addEventListener('click', () => {
    if (gameStarted && !gameOver) {
        canvas.requestPointerLock();
        shootHand();
    }
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
    if (isPointerLocked) {
        mouseMovementX += e.movementX;
        mouseMovementY += e.movementY;
    }
});

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameLoop();