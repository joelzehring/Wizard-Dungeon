import { checkAABBCollision } from '../utils.js';
import { COSMETICS_CATALOG } from '../cosmetics.js';

export class Player {
    constructor() {
        this.width = 32;
        this.height = 48;
        this.baseSpeed = 4.5;
        this.speed = this.baseSpeed;
        this.jumpForce = -11.5;
        this.gravity = 0.5;
        this.hasDoubleJump = false;
        this.canDoubleJump = false;
        this.hasHaste = false;
        this.invincible = false;
        this.selectedSpell = 0; // 0=Lightning, 1=Fireball, 2=IceShard, 3=Arcane

        this.cosmetics = {
            robe: 'violet_classic',
            hat: 'classic_hat',
            staff: 'oak_wand',
            aura: 'none'
        };

        this.auraParticles = [];
        this.reset();
    }

    setCosmetics(cosmetics) {
        if (cosmetics) {
            this.cosmetics = { ...this.cosmetics, ...cosmetics };
        }
    }

    reset() {
        this.x = 100;
        this.y = 200;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = "right";
        this.cooldown = false;
        this.speed = this.baseSpeed || 4.5;
        this.canDoubleJump = false;
        this.invincible = false;
        this.hasPet = false;
        this.auraParticles = [];
    }

    update(inputs, platforms, castSpell) {
        if (inputs.right) { this.vx = this.speed; this.facing = "right"; }
        else if (inputs.left) { this.vx = -this.speed; this.facing = "left"; }
        else { this.vx = 0; }

        if (inputs.jump) {
            if (this.isGrounded) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.canDoubleJump = this.hasDoubleJump;
                inputs.jump = false; // Prevent immediate double jump
            } else if (this.canDoubleJump) {
                this.vy = this.jumpForce * 0.8;
                this.canDoubleJump = false;
                inputs.jump = false;
            }
        }

        if (inputs.magic && !this.cooldown) {
            castSpell(this);
            this.cooldown = true;
            const cooldownMs = [250, 500, 400, 350][this.selectedSpell] ?? 300;
            setTimeout(() => this.cooldown = false, cooldownMs);
        }

        if (inputs.nextSpell) {
            this.selectedSpell = (this.selectedSpell + 1) % 4;
            inputs.nextSpell = false;
        }
        if (inputs.prevSpell) {
            this.selectedSpell = (this.selectedSpell + 3) % 4;
            inputs.prevSpell = false;
        }

        this.vy += this.gravity;

        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        this.resolveCollisions(platforms, "horizontal");

        this.y += this.vy;
        this.isGrounded = false;
        this.resolveCollisions(platforms, "vertical");

        this.updateAuraParticles();
    }

    updateAuraParticles() {
        const aura = this.cosmetics.aura;
        if (!aura || aura === 'none') return;

        // Spawn aura particles
        if (Math.random() < 0.4) {
            if (aura === 'sparkle_dust') {
                this.auraParticles.push({
                    x: (Math.random() - 0.5) * (this.width + 10),
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 0.8 - 0.2,
                    size: Math.random() * 2.5 + 1,
                    color: Math.random() > 0.5 ? '#fef08a' : '#fbbf24',
                    life: 30, maxLife: 30
                });
            } else if (aura === 'fire_flame') {
                this.auraParticles.push({
                    x: (Math.random() - 0.5) * (this.width + 4),
                    y: this.height - Math.random() * 10,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -Math.random() * 1.5 - 0.8,
                    size: Math.random() * 3.5 + 1.5,
                    color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
                    life: 25, maxLife: 25
                });
            } else if (aura === 'void_smoke') {
                this.auraParticles.push({
                    x: (Math.random() - 0.5) * (this.width + 8),
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -Math.random() * 0.6 - 0.2,
                    size: Math.random() * 4 + 2,
                    color: Math.random() > 0.5 ? '#c084fc' : '#581c87',
                    life: 35, maxLife: 35
                });
            }
        }

        // Update existing particles
        for (let i = this.auraParticles.length - 1; i >= 0; i--) {
            const p = this.auraParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.auraParticles.splice(i, 1);
            }
        }
    }

    resolveCollisions(platforms, axis) {
        platforms.forEach(platform => {
            if (checkAABBCollision(this, platform)) {
                if (axis === "horizontal") {
                    if (this.vx > 0) this.x = platform.x - this.width;
                    else if (this.vx < 0) this.x = platform.x + platform.width;
                } else if (axis === "vertical") {
                    if (this.vy > 0) {
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.isGrounded = true;
                    } else if (this.vy < 0) {
                        this.y = platform.y + platform.height;
                        this.vy = 0;
                    }
                }
            }
        });
    }

    getRobeColor() {
        const robeId = this.cosmetics.robe || 'violet_classic';
        const catalogItem = (COSMETICS_CATALOG.robe || []).find(r => r.id === robeId);
        if (robeId === 'rainbow_prismatic') {
            const hue = (Date.now() / 10) % 360;
            return `hsl(${hue}, 90%, 55%)`;
        }
        return catalogItem ? catalogItem.color : '#8b5cf6';
    }

    draw(ctx) {
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // --- DRAW BACK AURA ---
        this.drawAura(ctx);

        // --- ROBE & BODY ---
        const mainColor = this.getRobeColor();
        ctx.fillStyle = mainColor;
        ctx.fillRect(0, 16, this.width, this.height - 16);

        // Cyber neon pattern lines
        if (this.cosmetics.robe === 'cyber_neon') {
            ctx.strokeStyle = "#a5f3fc";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(4, 20); ctx.lineTo(this.width - 4, 20);
            ctx.moveTo(4, 30); ctx.lineTo(this.width - 4, 30);
            ctx.moveTo(this.width / 2, 16); ctx.lineTo(this.width / 2, this.height);
            ctx.stroke();
        }

        // --- HEAD / FACE ---
        ctx.fillStyle = "#ffdbac";
        ctx.fillRect(6, 8, this.width - 12, 12);

        // --- HAT ---
        this.drawHat(ctx, mainColor);

        // --- EYES & STAFF ---
        ctx.fillStyle = "#000";
        if (this.facing === "right") {
            ctx.fillRect(this.width - 12, 12, 3, 3);
            this.drawStaff(ctx, "right");
        } else {
            ctx.fillRect(9, 12, 3, 3);
            this.drawStaff(ctx, "left");
        }

        // --- PET COMPANION ---
        this.drawPet(ctx);

        ctx.restore();
    }

    drawPet(ctx) {
        if (!this.hasPet) return;

        const t = Date.now() * 0.005;
        const hoverY = Math.sin(t) * 4;
        const petX = this.facing === "right" ? -16 : this.width + 4;
        const petY = -10 + hoverY;

        ctx.save();
        ctx.translate(petX, petY);

        // Glowing outer aura
        const auraGrad = ctx.createRadialGradient(8, 8, 2, 8, 8, 14);
        auraGrad.addColorStop(0, "rgba(244, 114, 182, 0.9)");
        auraGrad.addColorStop(0.6, "rgba(192, 132, 252, 0.4)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(8, 8, 14, 0, Math.PI * 2);
        ctx.fill();

        // Cute Spirit Pet Body
        ctx.fillStyle = "#f472b6";
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(6, 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#1e1b4b";
        const eyeX = this.facing === "right" ? 10 : 3;
        ctx.fillRect(eyeX, 6, 2, 3);
        ctx.fillRect(eyeX + (this.facing === "right" ? 3 : 3), 6, 2, 3);

        // Wings
        const wingFlap = Math.sin(t * 3) * 3;
        ctx.fillStyle = "#e0e7ff";
        ctx.beginPath();
        ctx.ellipse(-1, 4 + wingFlap, 4, 2, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(17, 4 + wingFlap, 4, 2, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawAura(ctx) {
        const aura = this.cosmetics.aura;
        if (!aura || aura === 'none') return;

        ctx.save();
        if (aura === 'rainbow_glow') {
            const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
            const hue = (Date.now() / 8) % 360;
            const auraGrad = ctx.createRadialGradient(
                this.width / 2, this.height / 2, 5,
                this.width / 2, this.height / 2, (this.width + 20) * pulse
            );
            auraGrad.addColorStop(0, `hsla(${hue}, 90%, 65%, 0.6)`);
            auraGrad.addColorStop(0.6, `hsla(${(hue + 60) % 360}, 90%, 55%, 0.3)`);
            auraGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, (this.width + 20) * pulse, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw floating particles for sparkle_dust, fire_flame, void_smoke
            this.auraParticles.forEach(p => {
                const alpha = p.life / p.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(this.width / 2 + p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
        ctx.restore();
    }

    drawHat(ctx, mainColor) {
        const hatId = this.cosmetics.hat || 'classic_hat';
        const catalogRobe = (COSMETICS_CATALOG.robe || []).find(r => r.id === this.cosmetics.robe);
        const defaultHatColor = catalogRobe ? catalogRobe.hatColor : "#4c1d95";

        ctx.save();

        if (hatId === 'classic_hat') {
            ctx.fillStyle = defaultHatColor;
            ctx.beginPath();
            ctx.moveTo(-4, 12);
            ctx.lineTo(this.width + 4, 12);
            ctx.lineTo(this.width / 2, -4);
            ctx.closePath();
            ctx.fill();
            // Yellow buckle
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(this.width / 2 - 3, 7, 6, 5);
        } else if (hatId === 'starry_cap') {
            ctx.fillStyle = "#1e1b4b";
            ctx.beginPath();
            ctx.moveTo(-4, 12);
            ctx.lineTo(this.width + 4, 12);
            ctx.lineTo(this.width / 2, -6);
            ctx.closePath();
            ctx.fill();
            // Golden stars on hat
            ctx.fillStyle = "#fef08a";
            ctx.fillRect(this.width / 2 - 2, 2, 4, 4);
            ctx.fillRect(this.width / 2 - 6, 8, 3, 3);
            ctx.fillRect(this.width / 2 + 4, 7, 3, 3);
        } else if (hatId === 'archmage_crown') {
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.moveTo(-2, 12);
            ctx.lineTo(-2, 0);
            ctx.lineTo(4, 6);
            ctx.lineTo(this.width / 2, -2);
            ctx.lineTo(this.width - 4, 6);
            ctx.lineTo(this.width + 2, 0);
            ctx.lineTo(this.width + 2, 12);
            ctx.closePath();
            ctx.fill();
            // Center Gem
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(this.width / 2, 4, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (hatId === 'witch_brim') {
            ctx.fillStyle = "#311042";
            // Extra wide brim
            ctx.fillRect(-10, 10, this.width + 20, 4);
            ctx.beginPath();
            ctx.moveTo(-4, 10);
            ctx.lineTo(this.width + 4, 10);
            ctx.lineTo(this.width / 2 - 2, -10);
            ctx.closePath();
            ctx.fill();
            // Purple band & gold buckle
            ctx.fillStyle = "#c084fc";
            ctx.fillRect(-2, 7, this.width + 4, 3);
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(this.width / 2 - 3, 6, 6, 4);
        } else if (hatId === 'horned_helm') {
            ctx.fillStyle = "#334155";
            ctx.fillRect(2, 4, this.width - 4, 8);
            // Horns
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath();
            // Left horn
            ctx.moveTo(4, 8); ctx.lineTo(-8, -4); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
            // Right horn
            ctx.beginPath();
            ctx.moveTo(this.width - 4, 8); ctx.lineTo(this.width + 8, -4); ctx.lineTo(this.width, 4); ctx.closePath(); ctx.fill();
            // Red eyes visor line
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(4, 9, this.width - 8, 2);
        } else if (hatId === 'royal_tiara') {
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath();
            ctx.moveTo(2, 12);
            ctx.lineTo(6, 4);
            ctx.lineTo(this.width / 2, 8);
            ctx.lineTo(this.width - 6, 4);
            ctx.lineTo(this.width - 2, 12);
            ctx.closePath();
            ctx.fill();
            // Emerald jewels
            ctx.fillStyle = "#10b981";
            ctx.fillRect(5, 3, 3, 3);
            ctx.fillRect(this.width - 8, 3, 3, 3);
            ctx.fillRect(this.width / 2 - 1.5, 7, 3, 3);
        } else if (hatId === 'bunny_ears') {
            // Base headband
            ctx.fillStyle = "#ec4899";
            ctx.fillRect(4, 9, this.width - 8, 3);
            // Ears outer white
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(6, -12, 6, 20);
            ctx.fillRect(this.width - 12, -12, 6, 20);
            // Ears inner pink
            ctx.fillStyle = "#f472b6";
            ctx.fillRect(8, -10, 2, 16);
            ctx.fillRect(this.width - 10, -10, 2, 16);
        }

        ctx.restore();
    }

    drawStaff(ctx, direction) {
        const staffId = this.cosmetics.staff || 'oak_wand';
        const sx = direction === "right" ? this.width : -4;
        const gemX = direction === "right" ? this.width + 2 : -2;

        ctx.save();

        if (staffId === 'oak_wand') {
            ctx.fillStyle = "#78350f"; ctx.fillRect(sx, 18, 4, 24);
            ctx.fillStyle = "#6ee7b7"; ctx.beginPath(); ctx.arc(gemX, 16, 4, 0, Math.PI * 2); ctx.fill();
        } else if (staffId === 'crystal_scepter') {
            ctx.fillStyle = "#94a3b8"; ctx.fillRect(sx, 16, 4, 26);
            ctx.fillStyle = "#22d3ee";
            ctx.beginPath();
            ctx.moveTo(gemX, 10);
            ctx.lineTo(gemX + 5, 15);
            ctx.lineTo(gemX, 20);
            ctx.lineTo(gemX - 5, 15);
            ctx.closePath();
            ctx.fill();
        } else if (staffId === 'flaming_torch') {
            ctx.fillStyle = "#475569"; ctx.fillRect(sx, 18, 4, 24);
            // Flickering flame tip
            const flameH = 8 + Math.sin(Date.now() * 0.02) * 2;
            ctx.fillStyle = "#f97316";
            ctx.beginPath(); ctx.arc(gemX, 15, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fef08a";
            ctx.beginPath(); ctx.arc(gemX, 14, 3, 0, Math.PI * 2); ctx.fill();
        } else if (staffId === 'star_scepter') {
            ctx.fillStyle = "#fbbf24"; ctx.fillRect(sx, 16, 4, 26);
            // Spinning star head
            ctx.save();
            ctx.translate(gemX, 12);
            ctx.rotate(Date.now() * 0.004);
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5;
                const r1 = 6, r2 = 2.5;
                ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
                ctx.lineTo(Math.cos(a + Math.PI / 5) * r2, Math.sin(a + Math.PI / 5) * r2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (staffId === 'shadow_blade') {
            ctx.fillStyle = "#1e1b4b"; ctx.fillRect(sx, 16, 4, 26);
            // Void blade
            ctx.fillStyle = "#c084fc";
            ctx.beginPath();
            if (direction === "right") {
                ctx.moveTo(sx + 2, 16); ctx.lineTo(sx + 14, 6); ctx.lineTo(sx + 2, 22);
            } else {
                ctx.moveTo(sx + 2, 16); ctx.lineTo(sx - 10, 6); ctx.lineTo(sx + 2, 22);
            }
            ctx.closePath();
            ctx.fill();
        } else if (staffId === 'celestial_orb') {
            ctx.fillStyle = "#334155"; ctx.fillRect(sx, 18, 4, 24);
            // Hovering orb above top
            const orbY = 10 + Math.sin(Date.now() * 0.008) * 3;
            ctx.fillStyle = "#e0e7ff";
            ctx.beginPath(); ctx.arc(gemX, orbY, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#a855f7";
            ctx.beginPath(); ctx.arc(gemX, orbY, 3, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }
}
