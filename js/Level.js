import { Enemy, Boss, FlyingEnemy, ShadowGoblin } from './entities/Enemy.js';
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
            if (e.type === 'shadowGoblin') return new ShadowGoblin(e);
            return new Enemy(e);
        });
        this.powerUps = (data.powerUps || []).map(p => new PowerUp(p.x, p.y, p.type));

        if (this.isBossLevel) {
            const isFinalBoss = data.name && (data.name.includes("Gorgon") || data.name.includes("World 2"));
            this.boss = new Boss({ x: 750, y: 220, maxHp: isFinalBoss ? 15 : 10, isFinal: isFinalBoss });
        } else {
            this.boss = null;
        }

        // Bonus Area
        this.rift = data.rift ? { ...data.rift, entered: false } : null;
        this.bonusAreaBgGradient = data.bonusAreaBgGradient || null;
        this.bonusPlatformColor = data.bonusPlatformColor || "#6d28d9";
        this.bonusEnemies = (data.bonusEnemies || []).map(e => {
            if (e.type === 'flying') return new FlyingEnemy(e);
            if (e.type === 'shadowGoblin') return new ShadowGoblin(e);
            return new Enemy(e);
        });
        this.bonusCrystals = (data.bonusCrystals || []).map(c => ({ ...c }));
        this.star = data.star ? { ...data.star } : null;
        this.returnPortal = data.returnPortal ? { ...data.returnPortal } : null;
    }

    drawEnvironment(ctx, canvas, cameraX, score) {
        // Determine if camera is in the bonus area (X >= 3800)
        const inBonusArea = cameraX > 3700;

        // Background gradient - blend between main and bonus when transitioning
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (inBonusArea && this.bonusAreaBgGradient) {
            gradient.addColorStop(0, this.bonusAreaBgGradient[0]);
            gradient.addColorStop(1, this.bonusAreaBgGradient[1]);
        } else {
            gradient.addColorStop(0, this.bgGradient[0]);
            gradient.addColorStop(1, this.bgGradient[1]);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Starfield / Particles
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        for (let i = 0; i < 30; i++) {
            ctx.fillRect((i * 135) % 2500, 40 + (i % 4) * 50, 2, 2);
        }
        // Bonus area stars
        if (!this.isBossLevel) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            for (let i = 0; i < 20; i++) {
                ctx.fillRect(4000 + (i * 280) % 1600, 30 + (i % 5) * 60, 2, 2);
            }
        }

        // Draw ALL platforms (main + bonus)
        this.platforms.forEach(p => {
            const isBonus = p.x >= 3800;
            const topColor = isBonus ? this.bonusPlatformColor : this.primaryColor;
            const bodyColor = isBonus ? this._darkenColor(this.bonusPlatformColor) : this.secondaryColor;
            ctx.fillStyle = topColor; ctx.fillRect(p.x, p.y, p.width, 6);
            ctx.fillStyle = bodyColor; ctx.fillRect(p.x, p.y + 6, p.width, p.height - 6);
        });

        if (!this.isBossLevel) {
            // Draw main crystals
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

            // Draw bonus crystals (golden)
            this.bonusCrystals.forEach(c => {
                if (!c.collected) {
                    let hover = Math.sin(Date.now() * 0.006 + 1) * 4;
                    // Glow
                    ctx.save();
                    ctx.shadowColor = "#fbbf24";
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = "#fbbf24";
                    ctx.beginPath();
                    ctx.moveTo(c.x + c.width / 2, c.y + hover);
                    ctx.lineTo(c.x + c.width, c.y + c.height / 2 + hover);
                    ctx.lineTo(c.x + c.width / 2, c.y + c.height + hover);
                    ctx.lineTo(c.x, c.y + c.height / 2 + hover);
                    ctx.closePath(); ctx.fill();
                    ctx.restore();
                }
            });

            // Main level portal
            if (score >= this.crystals.length) {
                ctx.save();
                ctx.translate(this.portalX, this.portalY);
                let pulseFactor = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                let pGrad = ctx.createRadialGradient(20, 35, 2, 20, 35, 35 * pulseFactor);
                pGrad.addColorStop(0, "#c084fc"); pGrad.addColorStop(0.5, "#7e22ce"); pGrad.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = pGrad; ctx.beginPath(); ctx.ellipse(20, 35, 20 * pulseFactor, 35 * pulseFactor, 0, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            // Draw Secret Rift
            if (this.rift) {
                this._drawRift(ctx, this.rift.x, this.rift.y, this.rift.width, this.rift.height);
            }

            // Draw Return Portal
            if (this.returnPortal) {
                this._drawReturnPortal(ctx, this.returnPortal.x, this.returnPortal.y, this.returnPortal.width, this.returnPortal.height);
            }

            // Draw Golden Star
            if (this.star && !this.star.collected) {
                this._drawStar(ctx, this.star.x, this.star.y, this.star.width);
            }
        }

        this.powerUps.forEach(p => p.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        this.bonusEnemies.forEach(e => e.draw(ctx));
        if (this.boss) this.boss.draw(ctx);

        ctx.restore();
    }

    _darkenColor(hex) {
        // Simple darkening: reduce hex color brightness
        try {
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            r = Math.max(0, r - 40);
            g = Math.max(0, g - 40);
            b = Math.max(0, b - 40);
            return `rgb(${r},${g},${b})`;
        } catch(e) {
            return this.secondaryColor;
        }
    }

    _drawRift(ctx, x, y, w, h) {
        const t = Date.now() * 0.002;
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        // Outer swirling glow rings
        for (let i = 3; i >= 0; i--) {
            const scale = 1 + i * 0.18 + Math.sin(t + i) * 0.06;
            const alpha = 0.15 - i * 0.03;
            ctx.save();
            ctx.rotate(t * 0.5 + i * 0.8);
            ctx.scale(scale, scale);
            const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.7);
            grad.addColorStop(0, `rgba(236, 72, 153, ${alpha + 0.1})`);
            grad.addColorStop(1, `rgba(147, 51, 234, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.ellipse(0, 0, w * 0.7, h * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Inner rift void
        const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.45);
        innerGrad.addColorStop(0, "rgba(10, 0, 30, 1)");
        innerGrad.addColorStop(0.6, "rgba(88, 28, 135, 0.8)");
        innerGrad.addColorStop(1, "rgba(236, 72, 153, 0)");
        ctx.fillStyle = innerGrad;
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.45, h * 0.38, 0, 0, Math.PI * 2); ctx.fill();

        // Spinning energy arcs
        ctx.strokeStyle = "rgba(240, 171, 252, 0.7)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(t * 1.5 + (i * Math.PI * 2 / 3));
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.42, -0.4, 0.4);
            ctx.stroke();
            ctx.restore();
        }

        // Label
        ctx.fillStyle = "rgba(240, 171, 252, 0.85)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SECRET RIFT", 0, h * 0.55);

        ctx.restore();
    }

    _drawReturnPortal(ctx, x, y, w, h) {
        const t = Date.now() * 0.002;
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        // Outer glow
        for (let i = 2; i >= 0; i--) {
            const scale = 1 + i * 0.2 + Math.sin(t + i) * 0.05;
            ctx.save();
            ctx.rotate(-t * 0.6 + i * 0.9);
            ctx.scale(scale, scale);
            const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.7);
            grad.addColorStop(0, `rgba(16, 185, 129, ${0.2 - i * 0.05})`);
            grad.addColorStop(1, `rgba(6, 182, 212, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.ellipse(0, 0, w * 0.7, h * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Inner void
        const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.42);
        innerGrad.addColorStop(0, "rgba(0, 15, 10, 1)");
        innerGrad.addColorStop(0.65, "rgba(6, 78, 59, 0.85)");
        innerGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = innerGrad;
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.42, h * 0.36, 0, 0, Math.PI * 2); ctx.fill();

        // Arcs
        ctx.strokeStyle = "rgba(110, 231, 183, 0.7)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(-t * 1.4 + (i * Math.PI * 2 / 3));
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.38, -0.4, 0.4);
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = "rgba(110, 231, 183, 0.85)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("RETURN", 0, h * 0.55);

        ctx.restore();
    }

    _drawStar(ctx, x, y, size) {
        const t = Date.now() * 0.003;
        const hover = Math.sin(t) * 5;
        const cx = x + size / 2;
        const cy = y + size / 2 + hover;
        const outerR = size * 0.6;
        const innerR = size * 0.25;
        const rotation = Math.sin(t * 0.4) * 0.2; // gentle sway

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        // Aura glow
        const auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, outerR * 2);
        auraGrad.addColorStop(0, "rgba(251, 191, 36, 0.5)");
        auraGrad.addColorStop(0.5, "rgba(251, 191, 36, 0.15)");
        auraGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath(); ctx.arc(0, 0, outerR * 2, 0, Math.PI * 2); ctx.fill();

        // 5-pointed star
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();

        // Gold gradient fill
        const starGrad = ctx.createRadialGradient(0, -outerR * 0.3, 1, 0, 0, outerR);
        starGrad.addColorStop(0, "#fef08a");
        starGrad.addColorStop(0.5, "#fbbf24");
        starGrad.addColorStop(1, "#d97706");
        ctx.fillStyle = starGrad;
        ctx.fill();
        ctx.strokeStyle = "#fef9c3";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Sparkle glints
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        const sparkleTime = Date.now() * 0.004;
        const sparkles = [
            [0, -outerR * 1.3],
            [outerR * 1.2, outerR * 0.4],
            [-outerR * 1.1, outerR * 0.3],
        ];
        sparkles.forEach(([sx, sy], idx) => {
            const alpha = (Math.sin(sparkleTime + idx * 1.5) + 1) / 2;
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}
