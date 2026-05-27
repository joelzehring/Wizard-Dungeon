import { checkAABBCollision } from '../utils.js';

export class Player {
    constructor() {
        this.reset();
        this.width = 32;
        this.height = 48;
        this.color = "#8b5cf6";
        this.hatColor = "#4c1d95";
        this.baseSpeed = 4.5;
        this.speed = this.baseSpeed;
        this.jumpForce = -11.5;
        this.gravity = 0.5;
        this.hasDoubleJump = false;
        this.canDoubleJump = false;
        this.hasHaste = false;
        this.invincible = false;
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
            setTimeout(() => this.cooldown = false, 300);
        }

        this.vy += this.gravity;

        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        this.resolveCollisions(platforms, "horizontal");

        this.y += this.vy;
        this.isGrounded = false;
        this.resolveCollisions(platforms, "vertical");
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

    draw(ctx) {
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 16, this.width, this.height - 16);
        ctx.fillStyle = "#ffdbac";
        ctx.fillRect(6, 8, this.width - 12, 12);
        ctx.fillStyle = this.hatColor;
        ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(this.width + 4, 12); ctx.lineTo(this.width / 2, -4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fbbf24"; ctx.fillRect(this.width / 2 - 3, 7, 6, 5);
        ctx.fillStyle = "#000";
        if (this.facing === "right") {
            ctx.fillRect(this.width - 12, 12, 3, 3);
            ctx.fillStyle = "#78350f"; ctx.fillRect(this.width, 18, 4, 24);
            ctx.fillStyle = "#6ee7b7"; ctx.beginPath(); ctx.arc(this.width + 2, 16, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillRect(9, 12, 3, 3);
            ctx.fillStyle = "#78350f"; ctx.fillRect(-4, 18, 4, 24);
            ctx.fillStyle = "#6ee7b7"; ctx.beginPath(); ctx.arc(-2, 16, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}
