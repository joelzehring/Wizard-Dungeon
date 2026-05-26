export class Enemy {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 24;
        this.height = config.height || 32;
        this.minX = config.minX;
        this.maxX = config.maxX;
        this.speed = config.speed || 1.5;
        this.alive = true;
    }

    update() {
        if (!this.alive) return;
        this.x += this.speed;
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            this.speed = -this.speed;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = "#1e1b4b"; ctx.fillRect(0, 8, this.width, this.height - 8);
        ctx.fillStyle = "#44165c"; ctx.fillRect(2, 0, this.width - 4, 10);
        ctx.fillStyle = "#f87171";
        if (this.speed > 0) {
            ctx.fillRect(this.width - 7, 4, 3, 3); ctx.fillRect(this.width - 12, 4, 3, 3);
        } else {
            ctx.fillRect(4, 4, 3, 3); ctx.fillRect(9, 4, 3, 3);
        }
        ctx.restore();
    }
}

export class FlyingEnemy extends Enemy {
    constructor(config) {
        super(config);
        this.baseY = config.y;
        this.amplitude = config.amplitude || 50;
        this.frequency = config.frequency || 0.05;
        this.time = 0;
    }

    update() {
        this.x += this.speed;
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            this.speed = -this.speed;
        }
        this.time += this.frequency;
        this.y = this.baseY + Math.sin(this.time) * this.amplitude;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = "#4c1d95";
        ctx.beginPath();
        ctx.moveTo(0, 10); ctx.lineTo(this.width/2, 0); ctx.lineTo(this.width, 10);
        ctx.lineTo(this.width/2, 20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#a78bfa";
        ctx.fillRect(this.width/2 - 2, 8, 4, 4);
        ctx.restore();
    }
}

export class Boss extends Enemy {
    constructor(config) {
        super(config);
        this.width = 64;
        this.height = 90;
        this.maxHp = config.maxHp || 10;
        this.hp = this.maxHp;
        this.shootCooldown = 0;
        this.hoverTime = 0;
        this.basePosition = config.y;
    }

    update(projectiles) {
        if (!this.alive) return;
        // Floating hover motion
        this.hoverTime += 0.04;
        this.y = this.basePosition + Math.sin(this.hoverTime) * 40;

        // Auto Attack sequence
        this.shootCooldown++;
        if (this.shootCooldown >= 90) { // Fires every 1.5 seconds
            projectiles.push({
                x: this.x - 15,
                y: this.y + 35,
                vx: -5,
                width: 16, height: 16
            });
            this.shootCooldown = 0;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Health Bar Overlay
        ctx.fillStyle = "#450a0a"; ctx.fillRect(-10, -20, 84, 8);
        ctx.fillStyle = "#ef4444"; ctx.fillRect(-10, -20, 84 * (this.hp / this.maxHp), 8);
        
        // Enemy Body Parts
        ctx.fillStyle = "#111827"; ctx.fillRect(0, 20, this.width, this.height - 20); // Cloak
        ctx.fillStyle = "#065f46"; ctx.fillRect(12, 0, this.width - 24, 25); // Daemon Head
        
        // Glowing Eyes
        let eyePulse = Math.sin(Date.now() * 0.02) * 2;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(22, 10, 4 + eyePulse / 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(42, 10, 4 + eyePulse / 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}
