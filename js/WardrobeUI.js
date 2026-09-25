import { COSMETICS_CATALOG, loadCosmeticsState, saveCosmeticsState } from './cosmetics.js';
import { Player } from './entities/Player.js';

export class WardrobeUI {
    constructor(game) {
        this.game = game;
        this.state = loadCosmeticsState();
        this.activeCategory = 'robe';
        this.modalElement = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        this.previewPlayer = new Player();
        this.previewAnimId = null;
        this.isOpen = false;

        this.injectStyles();
        this.createDOM();
    }

    injectStyles() {
        if (document.getElementById('wardrobeStyles')) return;
        const style = document.createElement('style');
        style.id = 'wardrobeStyles';
        style.textContent = `
            .wardrobe-modal-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(8, 4, 20, 0.85);
                backdrop-filter: blur(8px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .wardrobe-modal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .wardrobe-card {
                width: 92%;
                max-width: 760px;
                max-height: 90vh;
                background: linear-gradient(135deg, rgba(26, 16, 51, 0.95), rgba(15, 7, 33, 0.98));
                border: 2px solid #7c3aed;
                border-radius: 16px;
                box-shadow: 0 0 30px rgba(124, 58, 237, 0.4), inset 0 0 15px rgba(167, 139, 250, 0.1);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .wardrobe-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background: rgba(124, 58, 237, 0.15);
                border-bottom: 1px solid rgba(167, 139, 250, 0.2);
            }
            .wardrobe-title-box h2 {
                margin: 0;
                font-size: 22px;
                color: #c084fc;
                text-shadow: 0 0 10px rgba(192, 132, 252, 0.5);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .wardrobe-wallet {
                display: flex;
                gap: 16px;
                font-weight: bold;
                font-size: 15px;
                background: rgba(0, 0, 0, 0.4);
                padding: 6px 14px;
                border-radius: 20px;
                border: 1px solid rgba(251, 191, 36, 0.3);
            }
            .wallet-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .wallet-item.crystals { color: #38bdf8; }
            .wallet-item.stars { color: #fbbf24; }
            .close-btn {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid #ef4444;
                color: #fca5a5;
                font-size: 18px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s;
            }
            .close-btn:hover {
                background: #ef4444;
                color: #fff;
                transform: scale(1.08);
            }
            .wardrobe-body {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            @media (max-width: 640px) {
                .wardrobe-body {
                    flex-direction: column;
                }
            }
            .wardrobe-preview-panel {
                width: 220px;
                background: rgba(10, 5, 25, 0.6);
                border-right: 1px solid rgba(167, 139, 250, 0.15);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px 15px;
            }
            @media (max-width: 640px) {
                .wardrobe-preview-panel {
                    width: 100%;
                    border-right: none;
                    border-bottom: 1px solid rgba(167, 139, 250, 0.15);
                    padding: 10px;
                }
            }
            .preview-canvas-box {
                background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(12, 5, 26, 0.9) 70%);
                border: 2px solid #8b5cf6;
                border-radius: 12px;
                box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
                padding: 8px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .preview-canvas {
                width: 150px;
                height: 150px;
                image-rendering: pixelated;
            }
            .preview-label {
                margin-top: 12px;
                font-size: 13px;
                color: #a78bfa;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .wardrobe-content-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 16px;
            }
            .wardrobe-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                border-bottom: 2px solid rgba(124, 58, 237, 0.3);
                padding-bottom: 8px;
            }
            .tab-btn {
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid rgba(139, 92, 246, 0.3);
                color: #c4b5fd;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                font-size: 13px;
                transition: all 0.2s;
            }
            .tab-btn:hover {
                background: rgba(139, 92, 246, 0.25);
                color: #fff;
            }
            .tab-btn.active {
                background: #8b5cf6;
                border-color: #a78bfa;
                color: #fff;
                box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
            }
            .items-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 12px;
                overflow-y: auto;
                padding-right: 6px;
                max-height: 400px;
            }
            .items-grid::-webkit-scrollbar {
                width: 6px;
            }
            .items-grid::-webkit-scrollbar-thumb {
                background: #6d28d9;
                border-radius: 4px;
            }
            .item-card {
                background: rgba(30, 20, 60, 0.6);
                border: 1px solid rgba(139, 92, 246, 0.25);
                border-radius: 10px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                transition: all 0.2s;
                position: relative;
            }
            .item-card:hover {
                border-color: #a78bfa;
                background: rgba(45, 30, 90, 0.7);
                transform: translateY(-2px);
            }
            .item-card.equipped {
                border: 2px solid #10b981;
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
            }
            .item-name {
                font-weight: bold;
                font-size: 14px;
                color: #f1f5f9;
                margin-bottom: 4px;
            }
            .item-desc {
                font-size: 11px;
                color: #94a3b8;
                margin-bottom: 10px;
                line-height: 1.3;
            }
            .item-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 6px;
            }
            .item-cost {
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 3px;
            }
            .item-cost.crystals { color: #38bdf8; }
            .item-cost.stars { color: #fbbf24; }
            .item-action-btn {
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
            }
            .item-action-btn.buy-btn {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: #fff;
                box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);
            }
            .item-action-btn.buy-btn:hover {
                filter: brightness(1.1);
                transform: scale(1.04);
            }
            .item-action-btn.buy-btn:disabled {
                background: #475569;
                color: #94a3b8;
                opacity: 0.6;
                cursor: not-allowed;
                box-shadow: none;
                transform: none;
            }
            .item-action-btn.equip-btn {
                background: #8b5cf6;
                color: #fff;
            }
            .item-action-btn.equip-btn:hover {
                background: #7c3aed;
                transform: scale(1.04);
            }
            .item-action-btn.equipped-badge {
                background: rgba(16, 185, 129, 0.2);
                color: #34d399;
                border: 1px solid #10b981;
                cursor: default;
            }
            .wardrobe-toast {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(16, 185, 129, 0.9);
                color: #fff;
                padding: 8px 18px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 13px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 1050;
            }
            .wardrobe-toast.show {
                opacity: 1;
            }
            .wardrobe-open-btn {
                background: linear-gradient(135deg, #8b5cf6, #6d28d9);
                border: 2px solid #a78bfa;
                color: #fff;
                font-size: 13px;
                font-weight: bold;
                padding: 6px 14px;
                border-radius: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4);
                transition: all 0.2s ease;
                z-index: 20;
            }
            .wardrobe-open-btn:hover {
                background: linear-gradient(135deg, #a78bfa, #7c3aed);
                transform: scale(1.05);
                box-shadow: 0 6px 14px rgba(167, 139, 250, 0.6);
            }
        `;
        document.head.appendChild(style);
    }

    createDOM() {
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'wardrobe-modal-overlay';
        this.modalElement.id = 'wardrobeModal';

        this.modalElement.innerHTML = `
            <div class="wardrobe-card">
                <div class="wardrobe-header">
                    <div class="wardrobe-title-box">
                        <h2>👗 Wizard Cosmetics Wardrobe</h2>
                    </div>
                    <div class="wardrobe-wallet">
                        <div class="wallet-item crystals">💎 <span id="wdCrystalsCount">0</span></div>
                        <div class="wallet-item stars">⭐ <span id="wdStarsCount">0</span></div>
                    </div>
                    <button class="close-btn" id="wdCloseBtn">&times;</button>
                </div>
                <div class="wardrobe-body">
                    <div class="wardrobe-preview-panel">
                        <div class="preview-canvas-box">
                            <canvas class="preview-canvas" id="wdPreviewCanvas" width="160" height="180"></canvas>
                        </div>
                        <div class="preview-label">Live Preview</div>
                    </div>
                    <div class="wardrobe-content-panel">
                        <div class="wardrobe-tabs">
                            <button class="tab-btn active" data-cat="robe">👘 Robes</button>
                            <button class="tab-btn" data-cat="hat">🎩 Hats</button>
                            <button class="tab-btn" data-cat="staff">🪄 Staves</button>
                            <button class="tab-btn" data-cat="aura">✨ Auras</button>
                        </div>
                        <div class="items-grid" id="wdItemsGrid"></div>
                    </div>
                </div>
                <div class="wardrobe-toast" id="wdToast">Item Unlocked!</div>
            </div>
        `;

        document.body.appendChild(this.modalElement);

        // Preview canvas setup
        this.previewCanvas = document.getElementById('wdPreviewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // Event listeners
        document.getElementById('wdCloseBtn').addEventListener('click', () => this.close());
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) this.close();
        });

        const tabs = this.modalElement.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeCategory = tab.getAttribute('data-cat');
                this.renderGrid();
            });
        });
    }

    showToast(message) {
        const toast = document.getElementById('wdToast');
        if (!toast) return;
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    updateWalletDisplay() {
        const crystalsEl = document.getElementById('wdCrystalsCount');
        const starsEl = document.getElementById('wdStarsCount');
        if (crystalsEl) crystalsEl.innerText = this.state.crystals;
        if (starsEl) starsEl.innerText = this.state.stars;
    }

    addCurrency(crystals = 0, stars = 0) {
        this.state.crystals += crystals;
        this.state.stars += stars;
        saveCosmeticsState(this.state);
        this.updateWalletDisplay();
    }

    open() {
        this.state = loadCosmeticsState();
        this.isOpen = true;
        this.updateWalletDisplay();
        this.renderGrid();
        this.modalElement.classList.add('active');

        // Start live preview loop
        this.startPreviewAnim();
    }

    close() {
        this.isOpen = false;
        this.modalElement.classList.remove('active');
        if (this.previewAnimId) {
            cancelAnimationFrame(this.previewAnimId);
            this.previewAnimId = null;
        }
    }

    startPreviewAnim() {
        if (this.previewAnimId) cancelAnimationFrame(this.previewAnimId);

        const animate = () => {
            if (!this.isOpen) return;

            // Sync preview player with state
            this.previewPlayer.setCosmetics(this.state.equipped);
            this.previewPlayer.x = 64;
            this.previewPlayer.y = 70;
            this.previewPlayer.facing = "right";
            this.previewPlayer.updateAuraParticles();

            // Render background & player
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            this.previewPlayer.draw(this.previewCtx);

            this.previewAnimId = requestAnimationFrame(animate);
        };
        animate();
    }

    renderGrid() {
        const grid = document.getElementById('wdItemsGrid');
        grid.innerHTML = '';

        const items = COSMETICS_CATALOG[this.activeCategory] || [];
        const equippedId = this.state.equipped[this.activeCategory];

        items.forEach(item => {
            const isUnlocked = this.state.unlocked.includes(item.id);
            const isEquipped = equippedId === item.id;
            const canAfford = item.costType === 'crystals'
                ? this.state.crystals >= item.cost
                : this.state.stars >= item.cost;

            const card = document.createElement('div');
            card.className = `item-card ${isEquipped ? 'equipped' : ''}`;

            let actionHtml = '';
            if (isEquipped) {
                actionHtml = `<span class="item-action-btn equipped-badge">✓ EQUIPPED</span>`;
            } else if (isUnlocked) {
                actionHtml = `<button class="item-action-btn equip-btn" data-id="${item.id}">EQUIP</button>`;
            } else {
                const icon = item.costType === 'crystals' ? '💎' : '⭐';
                actionHtml = `<button class="item-action-btn buy-btn" data-id="${item.id}" ${canAfford ? '' : 'disabled'}>BUY (${icon} ${item.cost})</button>`;
            }

            const costIcon = item.costType === 'crystals' ? '💎' : '⭐';
            const costText = item.cost === 0 ? 'FREE' : `${costIcon} ${item.cost} ${item.costType}`;

            card.innerHTML = `
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
                <div class="item-footer">
                    <div class="item-cost ${item.costType}">${costText}</div>
                    <div>${actionHtml}</div>
                </div>
            `;

            // Button handlers
            const equipBtn = card.querySelector('.equip-btn');
            if (equipBtn) {
                equipBtn.addEventListener('click', () => this.equipItem(item.id));
            }

            const buyBtn = card.querySelector('.buy-btn');
            if (buyBtn && canAfford) {
                buyBtn.addEventListener('click', () => this.buyItem(item));
            }

            grid.appendChild(card);
        });
    }

    buyItem(item) {
        if (item.costType === 'crystals') {
            if (this.state.crystals < item.cost) return;
            this.state.crystals -= item.cost;
        } else {
            if (this.state.stars < item.cost) return;
            this.state.stars -= item.cost;
        }

        if (!this.state.unlocked.includes(item.id)) {
            this.state.unlocked.push(item.id);
        }

        // Auto equip
        this.state.equipped[this.activeCategory] = item.id;

        saveCosmeticsState(this.state);
        this.updateWalletDisplay();
        this.renderGrid();
        this.showToast(`✨ Unlocked & Equipped ${item.name}!`);

        // Sync with active game player
        if (this.game && this.game.player) {
            this.game.player.setCosmetics(this.state.equipped);
        }
    }

    equipItem(itemId) {
        this.state.equipped[this.activeCategory] = itemId;
        saveCosmeticsState(this.state);
        this.renderGrid();
        this.showToast(`Equipped ${itemId.replace('_', ' ')}!`);

        // Sync with active game player
        if (this.game && this.game.player) {
            this.game.player.setCosmetics(this.state.equipped);
        }
    }
}
