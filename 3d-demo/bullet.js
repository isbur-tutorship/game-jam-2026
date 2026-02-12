class Bullet {
    constructor(scene, position, direction) {
        this.scene = scene;
        this.speed = 0.8;
        this.lifetime = 3000; // 3 секунды
        this.createdAt = Date.now();
        
        // Создание пули (красная светящаяся)
        const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.4);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        });
        
        // Добавляем точечный свет к пуле
        this.light = new THREE.PointLight(0xff0000, 1, 5);
        this.light.castShadow = false;
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        // Отключили тени для производительности
        
        // Прикрепляем свет к пуле
        this.mesh.add(this.light);
        
        // Направление движения
        this.velocity = direction.clone().normalize().multiplyScalar(this.speed);
        
        // Поворачиваем пулю в направлении движения
        this.mesh.lookAt(position.clone().add(this.velocity));
        
        scene.add(this.mesh);
    }
    
    update() {
        // Движение пули
        this.mesh.position.add(this.velocity);
        
        // Гравитация (легкое падение)
        this.velocity.y -= 0.002;
        
        // Проверка времени жизни
        if (Date.now() - this.createdAt > this.lifetime) {
            return false; // Пуля устарела
        }
        
        // Проверка столкновения с землей
        if (this.mesh.position.y <= 0) {
            return false; // Пуля упала
        }
        
        return true; // Пуля активна
    }
    
    destroy() {
        this.scene.remove(this.mesh);
        if (this.light) {
            this.light.dispose();
        }
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
    
    getPosition() {
        return this.mesh.position;
    }
}

class BulletManager {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
    }
    
    createBullet(position, direction) {
        const bullet = new Bullet(this.scene, position, direction);
        this.bullets.push(bullet);
    }
    
    update() {
        // Обновляем все пули
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (!bullet.update()) {
                // Пуля неактивна, удаляем
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    getBullets() {
        return this.bullets;
    }
    
    clear() {
        this.bullets.forEach(bullet => bullet.destroy());
        this.bullets = [];
    }
}
