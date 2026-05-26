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

        this.currentLevelIndex = 0;
        this.score = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.camera = { x: 0, width: this.canvas.width, height: this.canvas.height };
        this.inputs = { left: false, right: false, jump: false, magic: false };

        this.player = new Player();
        this.activeLevel = null;
        this.spells = [];
        this.particles = [];
        this.enemyProjectiles = [];

        this.initInputs();
        this.loadLevel(0);
        this.loop();
    }

    initInputs() {
        window.addEventListener("keydown", e => {
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
                e.preventDefault();
            }
            if (e.code === "ArrowRight" || e.code === "KeyD") this.inputs.right = true;
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.inputs.left = true;
            if (e.code === "ArrowUp" || e.code === "KeyW") this.inputs.jump = true;
            if (e.code === "Space") this.inputs.magic = true;
        });

        window.addEventListener("keyup", e => {
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
                this.inputs[inputAction] = true;
                btn.setPointerCapture(e.pointerId);
            }, { passive: false });

            btn.addEventListener('pointerup', (e) => {
                e.preventDefault();
                this.inputs[inputAction] = false;
                try { btn.releasePointerCapture(e.pointerId); } catch(err) {}
            }, { passive: false });

            btn.addEventListener('pointercancel', (e) => {
                e.preventDefault();
                this.inputs[inputAction] = false;
                try { btn.releasePointerCapture(e.pointerId); } catch(err) {}
            }, { passive: false });
        });

        this.canvas.addEventListener("click", () => {
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
    }

    castSpell(p) {
        this.spells.push({
            x: p.facing === "right" ? p.x + p.width + 5 : p.x - 15,
            y: p.y + 20,
            vx: p.facing === "right" ? 7 : -7,
            width: 10, height: 10, life: 60
        });
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

            level.enemies.forEach(enemy => {
                if (!enemy.alive) return;
                if (checkAABBCollision(wizard, enemy)) this.gameOver = true;
                
                this.spells.forEach((spell, sIdx) => {
                    if (checkAABBCollision(spell, enemy)) {
                        enemy.alive = false;
                        this.spells.splice(sIdx, 1);
                        createBurst(this.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#f28602", 16);
                    }
                });
            });

            if (this.score >= level.crystals.length) {
                const portalRect = { x: level.portalX, y: level.portalY, width: 40, height: 70 };
                if (checkAABBCollision(wizard, portalRect)) {
                    createBurst(this.particles, portalRect.x + 20, portalRect.y + 35, "#a855f7", 30);
                    this.loadLevel(this.currentLevelIndex + 1);
                }
            }
        } else if (level.isBossLevel && level.boss.alive) {
            if (checkAABBCollision(wizard, level.boss)) this.gameOver = true;

            this.enemyProjectiles.forEach(proj => {
                if (checkAABBCollision(wizard, proj)) this.gameOver = true;
            });

            this.spells.forEach((spell, sIdx) => {
                if (checkAABBCollision(spell, level.boss)) {
                    level.boss.hp--;
                    this.spells.splice(sIdx, 1);
                    createBurst(this.particles, level.boss.x + 10, spell.y, "#ff3333", 8);
                    this.scoreDisplay.innerText = level.boss.hp;
                    
                    if (level.boss.hp <= 0) {
                        level.boss.alive = false;
                        createBurst(this.particles, level.boss.x + 32, level.boss.y + 45, "#ef4444", 50);
                        createBurst(this.particles, level.boss.x + 32, level.boss.y + 45, "#fbbf24", 50);
                        setTimeout(() => { this.gameWon = true; }, 1000);
                    }
                }
            });
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

        if (wizard.y > this.canvas.height + 100) this.gameOver = true;
    }

    update() {
        if (this.gameOver || this.gameWon) return;

        this.player.update(this.inputs, this.activeLevel.platforms, this.castSpell.bind(this));

        if (!this.activeLevel.isBossLevel) {
            this.activeLevel.enemies.forEach(e => e.update());
        } else if (this.activeLevel.boss.alive) {
            this.activeLevel.boss.update(this.enemyProjectiles);
        }

        this.processInteractions();

        this.camera.x = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.activeLevel.isBossLevel && this.camera.x > 150) this.camera.x = 150; 

        // Update Spells
        for (let i = this.spells.length - 1; i >= 0; i--) {
            let s = this.spells[i]; s.x += s.vx; s.life--;
            if (Math.random() > 0.4) {
                this.particles.push({
                    x: s.x + 5, y: s.y + 5, vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1,
                    radius: Math.random() * 2 + 1, color: "#6ee7b7", alpha: 0.8, decay: 0.04
                });
            }
            if (s.life <= 0) this.spells.splice(i, 1);
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
    }

    draw() {
        this.activeLevel.drawEnvironment(this.ctx, this.canvas, this.camera.x, this.score);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);

        // Spells & Projectiles
        this.ctx.fillStyle = "#6ee7b7";
        this.spells.forEach(s => this.ctx.fillRect(s.x, s.y, s.width, s.height));

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

        if (this.gameOver || this.gameWon) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = this.gameOver ? "#f87171" : "#34d399";
            this.ctx.font = "bold 28px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.gameOver ? "GAME OVER" : "ALL REALMS SAVED!", this.canvas.width / 2, this.canvas.height / 2 - 10);
            this.ctx.fillStyle = "#a78bfa";
            this.ctx.font = "16px sans-serif";
            this.ctx.fillText("Click or tap the screen to try again", this.canvas.width / 2, this.canvas.height / 2 + 30);
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
