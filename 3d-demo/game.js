// Настройка сцены (темная, мрачная)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Черное небо
scene.fog = new THREE.Fog(0x0a0a0a, 10, 50); // Густой туман

// Камера
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Рендерер (ОПТИМИЗИРОВАННЫЙ)
const renderer = new THREE.WebGLRenderer({ 
    antialias: false,
    powerPreference: "high-performance",
    alpha: false,
    stencil: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false; // Отключаем тени
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Ограничиваем пиксели
document.body.appendChild(renderer.domElement);

// Освещение (усиленное для видимости)
const ambientLight = new THREE.AmbientLight(0x404060, 0.6); // Увеличили яркость
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x8090a0, 0.8); // Увеличили яркость
directionalLight.position.set(5, 20, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

// Дополнительный свет снизу для атмосферы
const fillLight = new THREE.DirectionalLight(0xff3333, 0.3);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

// Земля (темная, мрачная)
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x1a1a1a,
    shininess: 5
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
// Убрали receiveShadow
scene.add(ground);

// Массив зданий для коллизий
const buildings = [];

// Создание города
function createCity() {
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2a2a3a,
        shininess: 20
    });
    
    const windowMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6633,
        emissive: 0xff4422,
        emissiveIntensity: 1.0
    });
    
    // Создаем здания (МЕНЬШЕ для производительности)
    for (let i = 0; i < 12; i++) {
        const width = Math.random() * 4 + 3;
        const height = Math.random() * 20 + 8;
        const depth = Math.random() * 4 + 3;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        // Позиционируем здания по кругу вокруг игрока
        const angle = (i / 12) * Math.PI * 2;
        const distance = Math.random() * 25 + 20;
        building.position.x = Math.cos(angle) * distance;
        building.position.z = Math.sin(angle) * distance;
        building.position.y = height / 2;
        
        scene.add(building);
        
        // Сохраняем для коллизий
        buildings.push({
            x: building.position.x,
            z: building.position.z,
            width: width,
            depth: depth
        });
        
        // Добавляем окна (МЕНЬШЕ для производительности)
        const windowCount = Math.floor(height / 4);
        for (let j = 0; j < windowCount; j++) {
            if (Math.random() > 0.5) {
                // Только передняя сторона
                const window1 = new THREE.Mesh(
                    new THREE.BoxGeometry(width * 0.7, 0.5, 0.05),
                    windowMaterial
                );
                window1.position.y = j * 4 - height / 2 + 2;
                window1.position.z = depth / 2 + 0.05;
                building.add(window1);
            }
        }
    }
}

createCity();

// Звезды на небе для атмосферы (очень яркие и заметные)
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ 
    color: 0xffffff, 
    size: 2.0, // Увеличили размер
    transparent: false,
    sizeAttenuation: false // Не уменьшаются с расстоянием
});

const starsVertices = [];
for (let i = 0; i < 500; i++) { // Уменьшили с 3000 до 500
    const x = (Math.random() - 0.5) * 500;
    const y = Math.random() * 300 + 100; // Выше
    const z = (Math.random() - 0.5) * 500;
    starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Создание игрока
const player = new Player(scene);

// Один точечный свет на игроке (вместо двух)
const playerLight = new THREE.PointLight(0xff5544, 2.5, 20);
playerLight.position.set(0, 5, 0);
scene.add(playerLight);

// Менеджер пуль
const bulletManager = new BulletManager(scene);

// Камера (от третьего лица - фиксированная за спиной)
let cameraDistance = 8;
let cameraHeight = 3;
let playerRotation = 0; // Поворот игрока
let cameraPitch = 0.3;
let cameraShake = { x: 0, y: 0 }; // Дрожание камеры

// Управление
const keys = {};
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let isPointerLocked = false;

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Pointer Lock для управления мышью
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
    if (isPointerLocked) {
        // Поворачиваем игрока по горизонтали (БЕЗ ИНВЕРСИИ)
        playerRotation += e.movementX * 0.002;
        // Наклон камеры по вертикали (БЕЗ ИНВЕРСИИ)
        cameraPitch += e.movementY * 0.002;
        cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraPitch));
    }
});

renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 0 && isPointerLocked) {
        const bulletData = player.shoot();
        if (bulletData) {
            // Создаем пулю из позиции руки игрока
            const bulletStartPos = player.getBulletSpawnPosition();
            
            // Направление стрельбы (ВПЕРЕД от ИГРОКА)
            const direction = new THREE.Vector3(
                Math.sin(playerRotation),
                Math.tan(cameraPitch),
                Math.cos(playerRotation)
            );
            
            bulletManager.createBullet(bulletStartPos, direction);
            
            // Дрожание камеры при выстреле
            cameraShake.x = (Math.random() - 0.5) * 0.1;
            cameraShake.y = (Math.random() - 0.5) * 0.1;
        }
    }
});

// Изменение размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Информация
const statsDiv = document.getElementById('stats');

// Главный игровой цикл
function animate() {
    requestAnimationFrame(animate);
    
    // Сохраняем старую позицию для проверки коллизий
    const oldX = player.position.x;
    const oldZ = player.position.z;
    
    // Обновление игрока (используем поворот камеры)
    player.update(keys, playerRotation);
    
    // Проверка коллизий со зданиями
    for (let building of buildings) {
        const dx = Math.abs(player.position.x - building.x);
        const dz = Math.abs(player.position.z - building.z);
        
        // Если игрок врезался в здание - возвращаем его назад
        if (dx < (building.width / 2 + 0.5) && dz < (building.depth / 2 + 0.5)) {
            player.position.x = oldX;
            player.position.z = oldZ;
            player.group.position.copy(player.position);
            break;
        }
    }
    
    // Поворот головы игрока по направлению камеры (минимальный, т.к. тело уже повернуто)
    player.setHeadRotation(0, cameraPitch * 0.5);
    
    // Обновление света на игроке
    playerLight.position.x = player.position.x;
    playerLight.position.y = player.position.y + 5;
    playerLight.position.z = player.position.z;
    
    // Обновление позиции камеры (фиксированная за спиной)
    const offsetX = Math.sin(playerRotation) * cameraDistance;
    const offsetZ = Math.cos(playerRotation) * cameraDistance;
    
    // Применяем дрожание камеры
    cameraShake.x *= 0.9; // Затухание
    cameraShake.y *= 0.9;
    
    camera.position.x = player.position.x + offsetX + cameraShake.x;
    camera.position.y = player.position.y + cameraHeight + cameraShake.y;
    camera.position.z = player.position.z + offsetZ;
    
    // Камера смотрит на игрока с учетом pitch
    const lookAtPoint = new THREE.Vector3(
        player.position.x - Math.sin(playerRotation) * 2,
        player.position.y + 1.5 - Math.tan(cameraPitch) * 2,
        player.position.z - Math.cos(playerRotation) * 2
    );
    camera.lookAt(lookAtPoint);
    
    // Обновление пуль
    bulletManager.update();
    
    // Отображение информации
    statsDiv.innerHTML = `
        Позиция: (${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)})<br>
        На земле: ${player.onGround}<br>
        Бег: ${player.isRunning}<br>
        Пуль: ${bulletManager.getBullets().length}<br>
        ${!isPointerLocked ? '<span style="color: #ff6666; text-shadow: 0 0 10px #ff0000;">► КЛИКНИ ДЛЯ НАЧАЛА ◄</span>' : ''}
    `;
    
    renderer.render(scene, camera);
}

// Анимация звезд (медленное мерцание)
let starsTime = 0;

animate();

// Мерцание звезд (отключено - звезды всегда видны)
// setInterval(() => {
//     starsTime += 0.05;
//     starsMaterial.opacity = 0.7 + Math.sin(starsTime) * 0.3;
// }, 50);
