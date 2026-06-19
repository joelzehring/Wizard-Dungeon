import { levelData } from './data/levels.js';
import { Player } from './entities/Player.js';
import { Level } from './Level.js';
import { checkAABBCollision, createBurst } from './utils.js';

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.scoreDisplay = document.getElementById("scoreDisplay");
        this.levelDisplay = document.getElementById("levelDisplay");
        this.objectiveDisplay = document.getElementById("objectiveDisplay");
        this.livesDisplay = document.getElementById("livesDisplay");
        this.starsDisplay = document.getElementById("starsDisplay");

        this.currentLevelIndex = 0;
        this.score = 0;
        this.lives = 3;
        this.totalStars = 0;
        this.maxStars = 6;
        this.gameOver = false;
        this.gameWon = false;
        this.inTitleScreen = true;

        // Flash effect state
        this.flashAlpha = 0;
        this.flashColor = "#ffffff";

        // Discovery banner state
        this.bannerTimer = 0;
        this.bannerText = "";
        this.bannerSubText = "";
        this.bannerColor = "#fbbf24";

        // Hide header UI during Title Screen
        this.levelDisplay.style.opacity = "0";
        this.objectiveDisplay.style.opacity = "0";
        const livesCont = document.getElementById("livesContainer");
        if (livesCont) livesCont.style.opacity = "0";
        const starsCont = document.getElementById("starsContainer");
        if (starsCont) starsCont.style.opacity = "0";

        this.camera = { x: 0, width: this.canvas.width, height: this.canvas.height };
        this.inputs = { left: false, right: false, jump: false, magic: false, nextSpell: false, prevSpell: false };
        this.SPELL_DEFS = [
            { name: "Lightning Bolt", icon: "⚡", color: "#facc15", desc: "Fast & piercing" },
            { name: "Fireball",       icon: "🔥", color: "#f97316", desc: "Slow, explosive" },
            { name: "Ice Shard",      icon: "❄️",  color: "#67e8f9", desc: "Triple spread" },
            { name: "Arcane Missile", icon: "💜", color: "#c084fc", desc: "Seeks enemies" },
        ];

        this.player = new Player();
        this.activeLevel = null;
        this.spells = [];
        this.particles = [];
        this.enemyProjectiles = [];

        this.initInputs();
        this.loop();
    }

    startGame() {
        this.inTitleScreen = false;
        this.levelDisplay.style.opacity = "1";
        this.objectiveDisplay.style.opacity = "1";
        const livesCont = document.getElementById("livesContainer");
        if (livesCont) livesCont.style.opacity = "1";
        const starsCont = document.getElementById("starsContainer");
        if (starsCont) starsCont.style.opacity = "1";

        this.particles = [];
        this.loadLevel(0);
    }

    initInputs() {
        window.addEventListener("keydown", e => {
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
                e.preventDefault();
            }
            if (this.inTitleScreen) {
                this.startGame();
                return;
            }
            if (e.code === "ArrowRight" || e.code === "KeyD") this.inputs.right = true;
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.inputs.left = true;
            if (e.code === "ArrowUp" || e.code === "KeyW") this.inputs.jump = true;
            if (e.code === "Space") this.inputs.magic = true;
            if (e.code === "KeyE") this.inputs.nextSpell = true;
            if (e.code === "KeyQ") this.inputs.prevSpell = true;
        });

        window.addEventListener("keyup", e => {
            if (this.inTitleScreen) return;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.inputs.right = false;
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.inputs.left = false;
            if (e.code === "ArrowUp" || e.code === "KeyW") this.inputs.jump = false;
            if (e.code === "Space") this.inputs.magic = false;
        });

        window.addEventListener("blur", () => {
            this.inputs.left = false; this.inputs.right = false; this.inputs.jump = false; this.inputs.magic = false;
        });

        // Touch Controls
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            const inputAction = btn.getAttribute('data-input');
            if (!inputAction) return;

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (this.inTitleScreen) {
                    this.startGame();
                    return;
                }
                this.inputs[inputAction] = true;
                btn.setPointerCapture(e.pointerId);
            }, { passive: false });

            btn.addEventListener('pointerup', (e) => {
                e.preventDefault();
                if (this.inTitleScreen) return;
                this.inputs[inputAction] = false;
                try { btn.releasePointerCapture(e.pointerId); } catch(err) {}
            }, { passive: false });

            btn.addEventListener('pointercancel', (e) => {
                e.preventDefault();
                if (this.inTitleScreen) return;
                this.inputs[inputAction] = false;
                try { btn.releasePointerCapture(e.pointerId); } catch(err) {}
            }, { passive: false });
        });

        this.canvas.addEventListener("click", () => {
            if (this.inTitleScreen) {
                this.startGame();
                return;
            }
            if (this.gameOver || this.gameWon) {
                window.location.reload();
            }
        });
    }

    loadLevel(index) {
        if (index >= levelData.length) {
            this.gameWon = true;
            return;
        }
        this.currentLevelIndex = index;
        this.activeLevel = new Level(levelData[this.currentLevelIndex]);
        this.score = 0;

        this.player.reset();
        this.spells = [];
        this.particles = [];
        this.enemyProjectiles = [];

        this.levelDisplay.innerText = this.activeLevel.name;
        if (this.activeLevel.isBossLevel) {
            this.objectiveDisplay.innerHTML = "BOSS HP: <span id='scoreDisplay'>" + this.activeLevel.boss.hp + "</span>";
        } else {
            this.objectiveDisplay.innerHTML = "Crystals: <span id='scoreDisplay'>0/" + this.activeLevel.crystals.length + "</span>";
        }
        // Re-cache score display after innerHTML update
        this.scoreDisplay = document.getElementById("scoreDisplay");
        this.updateLivesUI();
        this.updateStarsUI();
    }

    updateLivesUI() {
        if (this.livesDisplay) {
            this.livesDisplay.innerText = "❤️".repeat(Math.max(0, this.lives));
        }
    }

    updateStarsUI() {
        if (this.starsDisplay) {
            this.starsDisplay.innerText = `${this.totalStars}/${this.maxStars}`;
        }
    }

    handlePlayerDeath() {
        this.lives--;
        this.updateLivesUI();

        // Visual death effect (burst of red particles)
        createBurst(this.particles, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, "#ef4444", 30);

        if (this.lives <= 0) {
            this.gameOver = true;
        } else {
            // Respawn player
            this.player.reset();
            // Clear current level spells and projectiles to prevent spawn camping
            this.spells = [];
            this.enemyProjectiles = [];

            // Give 1.5 seconds of invincibility
            this.player.invincible = true;
            setTimeout(() => {
                this.player.invincible = false;
            }, 1500);
        }
    }

    castSpell(p) {
        const dir = p.facing === "right" ? 1 : -1;
        const ox = p.facing === "right" ? p.x + p.width + 5 : p.x - 15;
        const oy = p.y + 20;

        switch (p.selectedSpell) {
            case 0: // ⚡ Lightning Bolt — fast, pierces
                this.spells.push({
                    type: "lightning", x: ox, y: oy + 2,
                    vx: dir * 14, vy: 0,
                    width: 18, height: 6, life: 50,
                    piercing: true, color: "#facc15"
                });
                // trail burst
                createBurst(this.particles, ox, oy + 5, "#fef08a", 5);
                break;

            case 1: // 🔥 Fireball — slow, large, explodes
                this.spells.push({
                    type: "fireball", x: ox, y: oy - 4,
                    vx: dir * 4, vy: 0,
                    width: 20, height: 20, life: 90,
                    piercing: false, color: "#f97316"
                });
                break;

            case 2: // ❄️ Ice Shard — 3-way spread
                [-0.25, 0, 0.25].forEach(vyOff => {
                    this.spells.push({
                        type: "ice", x: ox, y: oy,
                        vx: dir * 9, vy: vyOff * 6,
                        width: 12, height: 8, life: 45,
                        piercing: false, color: "#67e8f9"
                    });
                });
                createBurst(this.particles, ox, oy + 4, "#a5f3fc", 8);
                break;

            case 3: // 💜 Arcane Missile — homing
                this.spells.push({
                    type: "arcane", x: ox, y: oy,
                    vx: dir * 6, vy: 0,
                    width: 12, height: 12, life: 80,
                    piercing: false, color: "#c084fc",
                    homing: true
                });
                break;
        }
    }

    triggerFlash(color, strength = 0.7) {
        this.flashColor = color;
        this.flashAlpha = strength;
    }

    showBanner(text, subText, color = "#fbbf24", duration = 180) {
        this.bannerText = text;
        this.bannerSubText = subText;
        this.bannerColor = color;
        this.bannerTimer = duration;
    }

    processInteractions() {
        const wizard = this.player;
        const level = this.activeLevel;

        if (!level.isBossLevel) {
            level.crystals.forEach(crystal => {
                if (!crystal.collected && checkAABBCollision(wizard, crystal)) {
                    crystal.collected = true;
                    this.score++;
                    this.scoreDisplay.innerText = `${this.score}/${level.crystals.length}`;
                    createBurst(this.particles, crystal.x + 8, crystal.y + 10, "#00ffff");
                }
            });

            // Bonus crystals (golden)
            level.bonusCrystals.forEach(crystal => {
                if (!crystal.collected && checkAABBCollision(wizard, crystal)) {
                    crystal.collected = true;
                    createBurst(this.particles, crystal.x + 8, crystal.y + 10, "#fbbf24", 12);
                    this.triggerFlash("#fbbf24", 0.25);
                }
            });

            // Secret Rift — teleport to bonus area
            if (level.rift && !level.rift.entered) {
                const riftRect = { x: level.rift.x, y: level.rift.y, width: level.rift.width, height: level.rift.height };
                if (checkAABBCollision(wizard, riftRect)) {
                    level.rift.entered = true;
                    wizard.x = level.rift.targetX || 4050;
                    wizard.y = level.rift.targetY || 300;
                    wizard.vx = 0; wizard.vy = 0;
                    this.triggerFlash("#d946ef", 0.8);
                    createBurst(this.particles, wizard.x + wizard.width / 2, wizard.y + wizard.height / 2, "#d946ef", 40);
                    this.showBanner("SECRET BONUS AREA!", "Collect the Golden Star!", "#d946ef");
                }
            }

            // Return Portal — teleport back near main portal
            if (level.returnPortal) {
                const rpRect = { x: level.returnPortal.x, y: level.returnPortal.y, width: level.returnPortal.width, height: level.returnPortal.height };
                if (checkAABBCollision(wizard, rpRect)) {
                    wizard.x = level.returnPortal.targetX || (level.portalX - 100);
                    wizard.y = level.returnPortal.targetY || level.portalY;
                    wizard.vx = 0; wizard.vy = 0;
                    this.triggerFlash("#10b981", 0.7);
                    createBurst(this.particles, wizard.x + wizard.width / 2, wizard.y + wizard.height / 2, "#10b981", 30);
                    this.showBanner("RETURNED!", "Find all 6 stars!", "#10b981", 90);
                }
            }

            // Golden Star collection
            if (level.star && !level.star.collected) {
                const starRect = { x: level.star.x, y: level.star.y, width: level.star.width, height: level.star.height };
                if (checkAABBCollision(wizard, starRect)) {
                    level.star.collected = true;
                    this.totalStars++;
                    this.updateStarsUI();
                    // Bonus life (up to 5)
                    if (this.lives < 5) {
                        this.lives++;
                        this.updateLivesUI();
                    }
                    // Big golden explosion
                    createBurst(this.particles, starRect.x + starRect.width / 2, starRect.y + starRect.height / 2, "#fbbf24", 60);
                    createBurst(this.particles, starRect.x + starRect.width / 2, starRect.y + starRect.height / 2, "#fef08a", 40);
                    createBurst(this.particles, starRect.x + starRect.width / 2, starRect.y + starRect.height / 2, "#f59e0b", 25);
                    this.triggerFlash("#fef08a", 0.9);
                    this.showBanner("✨ ANCIENT STAR DISCOVERED!", "+1 Extra Life Awarded!", "#fbbf24", 240);
                }
            }

            // Normal enemies
            level.enemies.forEach(enemy => {
                if (!enemy.alive) return;
                if (!wizard.invincible && checkAABBCollision(wizard, enemy)) this.handlePlayerDeath();

                for (let sIdx = this.spells.length - 1; sIdx >= 0; sIdx--) {
                    const spell = this.spells[sIdx];
                    if (checkAABBCollision(spell, enemy)) {
                        enemy.alive = false;
                        const burstColor = spell.type === "fireball" ? "#f97316" : spell.type === "ice" ? "#a5f3fc" : spell.type === "arcane" ? "#c084fc" : "#facc15";
                        if (spell.type === "fireball") {
                            createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#f97316", 30);
                            createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#fbbf24", 16);
                            this.triggerFlash("#f97316", 0.2);
                        } else {
                            createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, burstColor, 16);
                        }
                        if (!spell.piercing) this.spells.splice(sIdx, 1);
                    }
                }
            });

            // Bonus area enemies
            level.bonusEnemies.forEach(enemy => {
                if (!enemy.alive) return;
                if (!wizard.invincible && checkAABBCollision(wizard, enemy)) this.handlePlayerDeath();

                for (let sIdx = this.spells.length - 1; sIdx >= 0; sIdx--) {
                    const spell = this.spells[sIdx];
                    if (checkAABBCollision(spell, enemy)) {
                        enemy.alive = false;
                        const burstColor = spell.type === "fireball" ? "#f97316" : spell.type === "ice" ? "#a5f3fc" : spell.type === "arcane" ? "#c084fc" : "#facc15";
                        if (spell.type === "fireball") {
                            createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#f97316", 30);
                            createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#fbbf24", 16);
                        } else {
                            createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, burstColor, 16);
                        }
                        if (!spell.piercing) this.spells.splice(sIdx, 1);
                    }
                }
            });

            if (this.score >= level.crystals.length) {
                const portalRect = { x: level.portalX, y: level.portalY, width: 40, height: 70 };
                if (checkAABBCollision(wizard, portalRect)) {
                    createBurst(this.particles, portalRect.x + 20, portalRect.y + 35, "#a855f7", 30);
                    this.loadLevel(this.currentLevelIndex + 1);
                }
            }
        } else if (level.isBossLevel && level.boss.alive) {
            if (!wizard.invincible && checkAABBCollision(wizard, level.boss)) this.handlePlayerDeath();

            this.enemyProjectiles.forEach(proj => {
                if (!wizard.invincible && checkAABBCollision(wizard, proj)) this.handlePlayerDeath();
            });

            for (let sIdx = this.spells.length - 1; sIdx >= 0; sIdx--) {
                const spell = this.spells[sIdx];
                if (checkAABBCollision(spell, level.boss)) {
                    level.boss.hp--;
                    if (!spell.piercing) this.spells.splice(sIdx, 1);
                    const burstColor = spell.type === "fireball" ? "#f97316" : spell.type === "ice" ? "#a5f3fc" : spell.type === "arcane" ? "#c084fc" : "#facc15";
                    createBurst(this.particles, level.boss.x + 10, spell.y, burstColor, 10);
                    this.scoreDisplay.innerText = level.boss.hp;

                    if (level.boss.hp <= 0) {
                        level.boss.alive = false;
                        createBurst(this.particles, level.boss.x + 32, level.boss.y + 45, "#ef4444", 50);
                        createBurst(this.particles, level.boss.x + 32, level.boss.y + 45, "#fbbf24", 50);

                        setTimeout(() => {
                            if (this.currentLevelIndex < levelData.length - 1) {
                                this.loadLevel(this.currentLevelIndex + 1);
                            } else {
                                this.gameWon = true;
                            }
                        }, 1000);
                    }
                }
            }
        }

        level.powerUps.forEach(p => {
            if (!p.collected && checkAABBCollision(wizard, p)) {
                p.collected = true;
                createBurst(this.particles, p.x + 10, p.y + 10, p.color, 15);

                if (p.type === 'haste') {
                    wizard.hasHaste = true;
                    wizard.speed = wizard.baseSpeed * 1.5;
                } else if (p.type === 'doubleJump') {
                    wizard.hasDoubleJump = true;
                }
            }
        });

        if (wizard.y > this.canvas.height + 100) this.handlePlayerDeath();
    }

    update() {
        if (this.inTitleScreen) {
            // Spawn slow-drifting magical background particles
            if (this.particles.length < 40 && Math.random() > 0.7) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: this.canvas.height + 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 1.0 - 0.5,
                    radius: Math.random() * 3 + 1.5,
                    color: Math.random() > 0.5 ? "#8b5cf6" : "#06b6d4",
                    alpha: Math.random() * 0.5 + 0.3,
                    decay: Math.random() * 0.005 + 0.002
                });
            }
            // Update drifting particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
                if (p.alpha <= 0 || p.y < -10) this.particles.splice(i, 1);
            }
            return;
        }

        if (this.gameOver || this.gameWon) return;

        this.player.update(this.inputs, this.activeLevel.platforms, this.castSpell.bind(this));

        if (!this.activeLevel.isBossLevel) {
            this.activeLevel.enemies.forEach(e => e.update());
            this.activeLevel.bonusEnemies.forEach(e => e.update());
        } else if (this.activeLevel.boss.alive) {
            this.activeLevel.boss.update(this.enemyProjectiles);
        }

        this.processInteractions();

        this.camera.x = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.activeLevel.isBossLevel && this.camera.x > 150) this.camera.x = 150;

        // Update Spells
        for (let i = this.spells.length - 1; i >= 0; i--) {
            let s = this.spells[i];

            // Arcane homing: steer toward nearest alive enemy
            if (s.homing && this.activeLevel) {
                const allEnemies = [
                    ...(this.activeLevel.enemies || []),
                    ...(this.activeLevel.bonusEnemies || []),
                    ...(this.activeLevel.boss && this.activeLevel.boss.alive ? [this.activeLevel.boss] : [])
                ].filter(e => e.alive !== false);
                let nearest = null, nearestDist = Infinity;
                allEnemies.forEach(e => {
                    const ex = e.x + (e.width || 0) / 2;
                    const ey = e.y + (e.height || 0) / 2;
                    const dist = Math.hypot(ex - s.x, ey - s.y);
                    if (dist < nearestDist) { nearest = e; nearestDist = dist; }
                });
                if (nearest && nearestDist < 350) {
                    const tx = nearest.x + (nearest.width || 0) / 2;
                    const ty = nearest.y + (nearest.height || 0) / 2;
                    const angle = Math.atan2(ty - s.y, tx - s.x);
                    const spd = Math.hypot(s.vx, s.vy) || 6;
                    s.vx += (Math.cos(angle) * spd - s.vx) * 0.12;
                    s.vy += (Math.sin(angle) * spd - s.vy) * 0.12;
                }
            }

            s.x += s.vx;
            s.y += s.vy;
            s.life--;

            // Spell-type trail particles
            const trailChance = s.type === "fireball" ? 0.9 : s.type === "lightning" ? 0.6 : 0.5;
            if (Math.random() < trailChance) {
                this.particles.push({
                    x: s.x + s.width / 2 + (Math.random() - 0.5) * 4,
                    y: s.y + s.height / 2 + (Math.random() - 0.5) * 4,
                    vx: (Math.random() - 0.5) * (s.type === "fireball" ? 2 : 1),
                    vy: (Math.random() - 0.5) * (s.type === "fireball" ? 2 : 1),
                    radius: Math.random() * (s.type === "fireball" ? 4 : 2) + 1,
                    color: s.color, alpha: 0.8, decay: s.type === "fireball" ? 0.03 : 0.05
                });
            }

            if (s.life <= 0) {
                // Fireball explodes on expiry too
                if (s.type === "fireball") {
                    createBurst(this.particles, s.x + 10, s.y + 10, "#f97316", 20);
                    createBurst(this.particles, s.x + 10, s.y + 10, "#fbbf24", 12);
                }
                this.spells.splice(i, 1);
            }
        }

        // Update Enemy Projectiles
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            let ep = this.enemyProjectiles[i];
            ep.x += ep.vx;
            if (Math.random() > 0.5) {
                this.particles.push({
                    x: ep.x + 8, y: ep.y + 8, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
                    radius: Math.random() * 3 + 1, color: "#ec4899", alpha: 0.7, decay: 0.05
                });
            }
            if (ep.x < 0) this.enemyProjectiles.splice(i, 1);
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }

        // Decay flash
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.035;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }

        // Decay banner
        if (this.bannerTimer > 0) {
            this.bannerTimer--;
        }
    }

    draw() {
        if (this.inTitleScreen) {
            // Draw deep space background gradient
            const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            bgGrad.addColorStop(0, "#0c051a");
            bgGrad.addColorStop(1, "#1e1b4b");
            this.ctx.fillStyle = bgGrad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw drifting background particles
            this.particles.forEach(p => {
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            });

            // Title text: WIZARD
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "#8b5cf6";
            this.ctx.font = "bold 56px 'Georgia', serif";
            this.ctx.shadowColor = "#a78bfa";
            this.ctx.shadowBlur = 15;
            this.ctx.fillText("WIZARD", this.canvas.width / 2, this.canvas.height / 2 - 80);

            // Title text: DUNGEON
            this.ctx.fillStyle = "#06b6d4";
            this.ctx.shadowColor = "#22d3ee";
            this.ctx.shadowBlur = 15;
            this.ctx.fillText("DUNGEON", this.canvas.width / 2, this.canvas.height / 2 - 20);

            this.ctx.shadowBlur = 0;

            // Decorative gold lines
            this.ctx.fillStyle = "#fbbf24";
            this.ctx.fillRect(this.canvas.width / 2 - 100, this.canvas.height / 2 + 5, 200, 3);

            // Pulsing start text
            let pulse = Math.abs(Math.sin(Date.now() * 0.003));
            this.ctx.fillStyle = `rgba(244, 63, 94, ${0.4 + pulse * 0.6})`;
            this.ctx.font = "bold 18px sans-serif";
            this.ctx.fillText("PRESS SPACE OR TAP TO ENTER", this.canvas.width / 2, this.canvas.height / 2 + 60);

            // Control guidelines card
            this.ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
            this.ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(this.canvas.width / 2 - 220, this.canvas.height / 2 + 100, 440, 95);
            this.ctx.strokeRect(this.canvas.width / 2 - 220, this.canvas.height / 2 + 100, 440, 95);

            this.ctx.fillStyle = "#e2e8f0";
            this.ctx.font = "bold 13px sans-serif";
            this.ctx.fillText("CONTROLS GUIDE", this.canvas.width / 2, this.canvas.height / 2 + 120);

            this.ctx.font = "12px sans-serif";
            this.ctx.fillStyle = "#cbd5e1";
            this.ctx.fillText("A / D or ⬅️ / ➡️ : MOVE", this.canvas.width / 2, this.canvas.height / 2 + 145);
            this.ctx.fillText("W or 🔼 : JUMP / DOUBLE JUMP", this.canvas.width / 2, this.canvas.height / 2 + 165);
            this.ctx.fillText("SPACE or ✨ BUTTON : CAST MAGIC SPELL", this.canvas.width / 2, this.canvas.height / 2 + 185);

            return;
        }

        this.activeLevel.drawEnvironment(this.ctx, this.canvas, this.camera.x, this.score);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);

        // Spells & Projectiles
        this.spells.forEach(s => {
            this.ctx.save();
            this.ctx.shadowColor = s.color;
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = s.color;
            if (s.type === "fireball") {
                // Glowing circle
                this.ctx.beginPath();
                this.ctx.arc(s.x + s.width / 2, s.y + s.height / 2, s.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                // Inner bright core
                this.ctx.fillStyle = "#fef08a";
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(s.x + s.width / 2, s.y + s.height / 2, s.width / 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (s.type === "lightning") {
                // Horizontal streak with jagged look
                const cx = s.x + s.width / 2, cy = s.y + s.height / 2;
                this.ctx.fillRect(s.x, cy - 3, s.width, 6);
                this.ctx.fillStyle = "#fff";
                this.ctx.shadowBlur = 0;
                this.ctx.fillRect(s.x + 2, cy - 1, s.width - 4, 2);
            } else if (s.type === "ice") {
                // Diamond shape
                const cx = s.x + s.width / 2, cy = s.y + s.height / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(cx, cy - s.height / 2);
                this.ctx.lineTo(cx + s.width / 2, cy);
                this.ctx.lineTo(cx, cy + s.height / 2);
                this.ctx.lineTo(cx - s.width / 2, cy);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (s.type === "arcane") {
                // Pulsing orb
                const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.015);
                this.ctx.beginPath();
                this.ctx.arc(s.x + s.width / 2, s.y + s.height / 2, (s.width / 2) * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = "#f0abfc";
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(s.x + s.width / 2, s.y + s.height / 2, (s.width / 4) * pulse, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(s.x, s.y, s.width, s.height);
            }
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        });

        this.enemyProjectiles.forEach(ep => {
            this.ctx.fillStyle = "#f472b6";
            this.ctx.beginPath(); this.ctx.arc(ep.x + 8, ep.y + 8, 8, 0, Math.PI * 2); this.ctx.fill();
        });

        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color; this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        });

        this.player.draw(this.ctx);
        this.ctx.restore();

        // Screen Flash Overlay
        if (this.flashAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flashAlpha;
            this.ctx.fillStyle = this.flashColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }

        // Discovery Banner
        if (this.bannerTimer > 0) {
            const progress = this.bannerTimer / 240;
            const fadeAlpha = this.bannerTimer < 40 ? this.bannerTimer / 40 : (this.bannerTimer > 200 ? (240 - this.bannerTimer) / 40 : 1);
            const bannerY = this.canvas.height / 2 - 60 - (1 - Math.min(progress * 3, 1)) * 30;

            this.ctx.save();
            this.ctx.globalAlpha = fadeAlpha;

            // Banner background
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            this.ctx.strokeStyle = this.bannerColor;
            this.ctx.lineWidth = 2;
            const bw = 480, bh = 70;
            const bx = this.canvas.width / 2 - bw / 2;
            const by = bannerY - 10;
            this.ctx.beginPath();
            this.ctx.roundRect(bx, by, bw, bh, 8);
            this.ctx.fill();
            this.ctx.stroke();

            // Banner text
            this.ctx.textAlign = "center";
            this.ctx.shadowColor = this.bannerColor;
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = this.bannerColor;
            this.ctx.font = "bold 22px sans-serif";
            this.ctx.fillText(this.bannerText, this.canvas.width / 2, bannerY + 20);

            this.ctx.shadowBlur = 6;
            this.ctx.fillStyle = "#e2e8f0";
            this.ctx.font = "14px sans-serif";
            this.ctx.fillText(this.bannerSubText, this.canvas.width / 2, bannerY + 44);

            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }

        // Spell HUD — bottom-left corner
        if (!this.gameOver && !this.gameWon) {
            const spellDefs = this.SPELL_DEFS;
            const sel = this.player.selectedSpell;
            const hudX = 12, hudY = this.canvas.height - 60;
            const boxW = 110, boxH = 46;

            this.ctx.save();
            this.ctx.globalAlpha = 0.88;
            this.ctx.fillStyle = "rgba(10, 5, 30, 0.7)";
            this.ctx.strokeStyle = spellDefs[sel].color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(hudX, hudY, boxW, boxH, 8);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.shadowColor = spellDefs[sel].color;
            this.ctx.shadowBlur = 8;
            this.ctx.fillStyle = spellDefs[sel].color;
            this.ctx.font = "bold 14px sans-serif";
            this.ctx.textAlign = "left";
            this.ctx.fillText(spellDefs[sel].icon + " " + spellDefs[sel].name, hudX + 8, hudY + 20);
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = "#94a3b8";
            this.ctx.font = "11px sans-serif";
            this.ctx.fillText(spellDefs[sel].desc, hudX + 8, hudY + 36);
            this.ctx.fillStyle = "#4b5563";
            this.ctx.font = "10px sans-serif";
            this.ctx.fillText("Q / E to switch", hudX + 8, hudY + 48);
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }

        if (this.gameOver || this.gameWon) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = this.gameOver ? "#f87171" : "#34d399";
            this.ctx.font = "bold 28px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.gameOver ? "GAME OVER" : "ALL REALMS SAVED!", this.canvas.width / 2, this.canvas.height / 2 - 30);

            if (this.gameWon) {
                this.ctx.fillStyle = "#fbbf24";
                this.ctx.font = "bold 18px sans-serif";
                this.ctx.fillText(`⭐ Ancient Stars Collected: ${this.totalStars}/${this.maxStars}`, this.canvas.width / 2, this.canvas.height / 2 + 5);
            }

            this.ctx.fillStyle = "#a78bfa";
            this.ctx.font = "16px sans-serif";
            this.ctx.fillText("Click or tap the screen to try again", this.canvas.width / 2, this.canvas.height / 2 + 35);
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// Start the game
new Game();
