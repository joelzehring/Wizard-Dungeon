import { Enemy, Boss, FlyingEnemy } from './entities/Enemy.js';
import { PowerUp } from './entities/PowerUp.js';

export class Level {
    constructor(data) {
        this.name = data.name;
        this.isBossLevel = data.isBossLevel;
        this.bgGradient = data.bgGradient;
        this.primaryColor = data.primaryColor;
        this.secondaryColor = data.secondaryColor;
        this.portalX = data.portalX;
        this.portalY = data.portalY;
        this.platforms = data.platforms;
        this.crystals = data.crystals.map(c => ({ ...c }));
        this.enemies = data.enemies.map(e => {
            if (e.type === 'flying') return new FlyingEnemy(e);
            return new Enemy(e);
        });
        this.powerUps = (data.powerUps || []).map(p => new PowerUp(p.x, p.y, p.type));
        
        if (this.isBossLevel) {
            this.boss = new Boss({ x: 750, y: 150, maxHp: 10 });
        } else {
            this.boss = null;
        }
    }

    drawEnvironment(ctx, canvas, cameraX, score) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.bgGradient[0]);
        gradient.addColorStop(1, this.bgGradient[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-cameraX, 0);

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        for (let i = 0; i < 30; i++) {
            ctx.fillRect((i * 135) % 2500, 40 + (i % 4) * 50, 2, 2);
        }

        this.platforms.forEach(p => {
            ctx.fillStyle = this.primaryColor; ctx.fillRect(p.x, p.y, p.width, 6);
            ctx.fillStyle = this.secondaryColor; ctx.fillRect(p.x, p.y + 6, p.width, p.height - 6);
        });

        if (!this.isBossLevel) {
            this.crystals.forEach(c => {
                if (!c.collected) {
                    ctx.fillStyle = "#22d3ee";
                    let hover = Math.sin(Date.now() * 0.005) * 4;
                    ctx.beginPath();
                    ctx.moveTo(c.x + c.width / 2, c.y + hover);
                    ctx.lineTo(c.x + c.width, c.y + c.height / 2 + hover);
                    ctx.lineTo(c.x + c.width / 2, c.y + c.height + hover);
                    ctx.lineTo(c.x, c.y + c.height / 2 + hover);
                    ctx.closePath(); ctx.fill();
                }
            });

            if (score >= this.crystals.length) {
                ctx.save();
                ctx.translate(this.portalX, this.portalY);
                let pulseFactor = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                let pGrad = ctx.createRadialGradient(20, 35, 2, 20, 35, 35 * pulseFactor);
                pGrad.addColorStop(0, "#c084fc"); pGrad.addColorStop(0.5, "#7e22ce"); pGrad.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = pGrad; ctx.beginPath(); ctx.ellipse(20, 35, 20 * pulseFactor, 35 * pulseFactor, 0, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        this.powerUps.forEach(p => p.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        if (this.boss) this.boss.draw(ctx);

        ctx.restore();
    }
}
