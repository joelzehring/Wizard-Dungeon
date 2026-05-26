export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type; // 'haste', 'doubleJump', 'shield'
        this.collected = false;
        this.color = this.getColor();
    }

    getColor() {
        switch(this.type) {
            case 'haste': return '#fcd34d';
            case 'doubleJump': return '#60a5fa';
            case 'shield': return '#34d399';
            default: return '#ffffff';
        }
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        let hover = Math.sin(Date.now() * 0.005) * 5;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y + hover, this.width, this.height);
        ctx.restore();
    }
}
