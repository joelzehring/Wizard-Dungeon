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

export class ShadowGoblin extends Enemy {
    constructor(config) {
        super(config);
        this.maxHp = config.hp || 3;
        this.hp = this.maxHp;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow aura
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
        ctx.shadowColor = "#7c3aed";
        ctx.shadowBlur = 6 + pulse * 6;

        // Body — darker, with purple tint
        ctx.fillStyle = "#0d0721"; ctx.fillRect(0, 8, this.width, this.height - 8);
        // Cloak highlights
        ctx.fillStyle = "#3b0764"; ctx.fillRect(0, 8, 3, this.height - 8);
        ctx.fillRect(this.width - 3, 8, 3, this.height - 8);
        // Head
        ctx.fillStyle = "#2e1065"; ctx.fillRect(2, 0, this.width - 4, 10);
        // Glowing eyes
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#a855f7";
        if (this.speed > 0) {
            ctx.fillRect(this.width - 7, 3, 3, 3); ctx.fillRect(this.width - 12, 3, 3, 3);
        } else {
            ctx.fillRect(4, 3, 3, 3); ctx.fillRect(9, 3, 3, 3);
        }

        ctx.shadowBlur = 0;

        // HP bar (only show if damaged)
        if (this.hp < this.maxHp) {
            const barW = this.width + 4;
            const barX = -2;
            const barY = -8;
            ctx.fillStyle = "#1a0030";
            ctx.fillRect(barX, barY, barW, 4);
            ctx.fillStyle = "#7c3aed";
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), 4);
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
        this.isFinal = config.isFinal || false;
    }

    update(projectiles) {
        if (!this.alive) return;
        // Floating hover motion
        this.hoverTime += 0.04;
        this.y = this.basePosition + Math.sin(this.hoverTime) * 50;

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
        
        if (this.isFinal) {
            // Gorgon Boss Visuals (Crimson Cloak with Gold Trim, Stony Head, writhing green snakes, red eyes)
            
            // Writhing Snake Hair (drawn in a layer behind/above head)
            ctx.strokeStyle = "#10b981"; // Emerald
            ctx.lineWidth = 4.5;
            let time = Date.now() * 0.003;
            for (let i = 0; i < 5; i++) {
                let angleOffset = (i - 2) * 0.45;
                let wave = Math.sin(time + i * 1.5) * 8;
                
                ctx.beginPath();
                ctx.moveTo(32 + angleOffset * 10, 10);
                ctx.quadraticCurveTo(
                    32 + angleOffset * 25 + wave, -15 - i * 3,
                    32 + angleOffset * 35 + wave * 1.2, -22
                );
                ctx.stroke();
                
                // Snake head / glowing tip
                ctx.fillStyle = "#34d399";
                ctx.beginPath();
                ctx.arc(32 + angleOffset * 35 + wave * 1.2, -22, 4.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Crimson Cloak
            ctx.fillStyle = "#7f1d1d"; ctx.fillRect(0, 20, this.width, this.height - 20); 
            
            // Gold Trims on Cloak
            ctx.fillStyle = "#f59e0b"; ctx.fillRect(0, 20, 5, this.height - 20); 
            ctx.fillStyle = "#f59e0b"; ctx.fillRect(this.width - 5, 20, 5, this.height - 20); 
            
            // Stony Gray head
            ctx.fillStyle = "#475569"; ctx.fillRect(12, 0, this.width - 24, 25);
            
            // Piercing Glowing Red Eyes
            let eyePulse = Math.sin(Date.now() * 0.025) * 2;
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath(); ctx.arc(22, 10, 4.5 + eyePulse / 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(42, 10, 4.5 + eyePulse / 2, 0, Math.PI * 2); ctx.fill();
        } else {
            // Original Gatekeeper Boss
            ctx.fillStyle = "#111827"; ctx.fillRect(0, 20, this.width, this.height - 20); // Cloak
            ctx.fillStyle = "#065f46"; ctx.fillRect(12, 0, this.width - 24, 25); // Daemon Head
            
            // Glowing Eyes
            let eyePulse = Math.sin(Date.now() * 0.02) * 2;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath(); ctx.arc(22, 10, 4 + eyePulse / 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(42, 10, 4 + eyePulse / 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}
