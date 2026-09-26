export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type; // 'haste', 'doubleJump', 'shield', 'pet'
        this.collected = false;
        this.color = this.getColor();
    }

    getColor() {
        switch(this.type) {
            case 'haste': return '#fcd34d';
            case 'doubleJump': return '#60a5fa';
            case 'shield': return '#34d399';
            case 'pet': return '#f472b6';
            default: return '#ffffff';
        }
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        let hover = Math.sin(Date.now() * 0.005) * 5;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;

        if (this.type === 'pet') {
            // Floating Pet Orb with wings
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2 + hover;

            // Outer spirit aura
            ctx.fillStyle = "rgba(244, 114, 182, 0.4)";
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();

            // Main spirit body
            ctx.fillStyle = "#f472b6";
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Cute wings
            ctx.fillStyle = "#e0e7ff";
            ctx.beginPath();
            ctx.ellipse(cx - 10, cy - 1, 4, 2, -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + 10, cy - 1, 4, 2, 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y + hover, this.width, this.height);
        }
        ctx.restore();
    }
}
