class Player {
    constructor(scene) {
        this.scene = scene;
        
        // Позиция и физика
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0; // Поворот тела
        this.speed = 0.15;
        this.runSpeed = 0.3;
        this.jumpPower = 0.3;
        this.gravity = 0.015;
        this.onGround = false;
        
        // Состояния
        this.isRunning = false;
        this.isWalking = false;
        this.isJumping = false;
        
        // Анимация
        this.walkCycle = 0;
        this.armSwing = 0;
        
        // Поворот головы
        this.headRotationY = 0;
        this.headRotationX = 0;
        
        // Стрельба
        this.isShooting = false;
        this.shootTimer = 0;
        this.armRecoil = 0;
        
        // Создание модели
        this.createModel();
    }
    
    createModel() {
        this.group = new THREE.Group();
        
        // Материалы (темные, мрачные цвета)
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a }); // Черная голова
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2d2d2d }); // Темно-серое тело
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a }); // Серые руки
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x1f1f1f }); // Темные ноги
        
        // Голова (0.5 x 0.5 x 0.5)
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, 1.75, 0);
        // Отключили тени для производительности
        
        // Глаза (красные светящиеся)
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.1, 0.25);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.1, 0.25);
        this.head.add(leftEye);
        this.head.add(rightEye);
        
        this.group.add(this.head);
        
        // Тело (0.7 x 1 x 0.4)
        const bodyGeometry = new THREE.BoxGeometry(0.7, 1, 0.4);
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 1, 0);
        // Отключили тени
        this.group.add(this.body);
        
        // Левая рука
        const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.5, 1.2, 0);
        // Отключили тени
        this.leftArmPivot = new THREE.Group();
        this.leftArmPivot.position.set(-0.5, 1.5, 0);
        this.leftArm.position.set(0, -0.3, 0);
        this.leftArmPivot.add(this.leftArm);
        this.group.add(this.leftArmPivot);
        
        // Правая рука
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.5, 1.2, 0);
        // Отключили тени
        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(0.5, 1.5, 0);
        this.rightArm.position.set(0, -0.3, 0);
        this.rightArmPivot.add(this.rightArm);
        this.group.add(this.rightArmPivot);
        
        // Левая нога
        const legGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        // Отключили тени
        this.leftLegPivot = new THREE.Group();
        this.leftLegPivot.position.set(-0.2, 0.5, 0);
        this.leftLeg.position.set(0, -0.45, 0);
        this.leftLegPivot.add(this.leftLeg);
        this.group.add(this.leftLegPivot);
        
        // Правая нога
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        // Отключили тени
        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0.2, 0.5, 0);
        this.rightLeg.position.set(0, -0.45, 0);
        this.rightLegPivot.add(this.rightLeg);
        this.group.add(this.rightLegPivot);
        
        this.scene.add(this.group);
    }
    
    update(keys, cameraRotation) {
        // Движение относительно направления камеры
        const moveDirection = new THREE.Vector3();
        
        if (keys['w'] || keys['W'] || keys['ц'] || keys['Ц']) {
            moveDirection.z -= 1;
        }
        if (keys['s'] || keys['S'] || keys['ы'] || keys['Ы']) {
            moveDirection.z += 1;
        }
        if (keys['a'] || keys['A'] || keys['ф'] || keys['Ф']) {
            moveDirection.x -= 1;
        }
        if (keys['d'] || keys['D'] || keys['в'] || keys['В']) {
            moveDirection.x += 1;
        }
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Применяем поворот камеры к направлению движения
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
            
            const currentSpeed = keys['Shift'] ? this.runSpeed : this.speed;
            this.isRunning = keys['Shift'];
            this.isWalking = true;
            
            this.velocity.x = moveDirection.x * currentSpeed;
            this.velocity.z = moveDirection.z * currentSpeed;
            
            // Поворот персонажа всегда в сторону камеры (не может развернуться лицом к камере)
            this.rotation = cameraRotation;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
            this.isWalking = false;
            this.isRunning = false;
        }
        
        // Прыжок
        if (keys[' '] && this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
            this.isJumping = true;
        }
        
        // Гравитация
        if (!this.onGround) {
            this.velocity.y -= this.gravity;
        }
        
        // Применяем движение
        this.position.add(this.velocity);
        
        // Проверка земли
        if (this.position.y <= 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.onGround = true;
            this.isJumping = false;
        }
        
        // Обновляем позицию модели
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;
        
        // Анимация ходьбы/бега
        if (this.isWalking) {
            this.walkCycle += this.isRunning ? 0.3 : 0.15;
            
            // Анимация ног
            this.leftLegPivot.rotation.x = Math.sin(this.walkCycle) * (this.isRunning ? 0.8 : 0.5);
            this.rightLegPivot.rotation.x = Math.sin(this.walkCycle + Math.PI) * (this.isRunning ? 0.8 : 0.5);
            
            // Анимация рук
            this.leftArmPivot.rotation.x = Math.sin(this.walkCycle + Math.PI) * (this.isRunning ? 0.6 : 0.4);
            this.rightArmPivot.rotation.x = Math.sin(this.walkCycle) * (this.isRunning ? 0.6 : 0.4);
        } else {
            // Возврат в нейтральное положение
            this.leftLegPivot.rotation.x *= 0.9;
            this.rightLegPivot.rotation.x *= 0.9;
            this.leftArmPivot.rotation.x *= 0.9;
            this.rightArmPivot.rotation.x *= 0.9;
        }
        
        // Анимация прыжка - ноги поджаты
        if (this.isJumping) {
            this.leftLegPivot.rotation.x = -0.5;
            this.rightLegPivot.rotation.x = -0.5;
        }
        
        // Поворот головы
        this.head.rotation.y = this.headRotationY;
        this.head.rotation.x = this.headRotationX;
        
        // Таймер стрельбы
        if (this.shootTimer > 0) {
            this.shootTimer--;
            this.rightArmPivot.rotation.x = -1.5 + (this.armRecoil * 0.1);
            this.armRecoil -= 0.5;
        }
    }
    
    shoot() {
        if (this.shootTimer <= 0) {
            this.isShooting = true;
            this.shootTimer = 15;
            this.armRecoil = 8;
            
            setTimeout(() => {
                this.isShooting = false;
            }, 100);
            
            return true;
        }
        return false;
    }
    
    setHeadRotation(yaw, pitch) {
        this.headRotationY = yaw;
        this.headRotationX = pitch;
    }
    
    getBulletSpawnPosition() {
        // Получаем мировую позицию правой руки
        const worldPos = new THREE.Vector3();
        this.rightArm.getWorldPosition(worldPos);
        
        // Смещаем вперед от руки в направлении взгляда
        const offset = new THREE.Vector3(
            Math.sin(this.rotation) * 0.5,
            0,
            Math.cos(this.rotation) * 0.5
        );
        
        worldPos.add(offset);
        return worldPos;
    }
}
