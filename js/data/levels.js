export const levelData = [
    {
        name: "Realm 1: Mystical Caves",
        isBossLevel: false,
        bgGradient: ["#130b2b", "#25134a"],
        primaryColor: "#4c1d95",
        secondaryColor: "#2e1065",
        portalX: 2000, portalY: 300,
        platforms: [
            { x: 0, y: 400, width: 700, height: 50 },
            { x: 800, y: 400, width: 600, height: 50 },
            { x: 1500, y: 400, width: 800, height: 50 },
            { x: 250, y: 300, width: 150, height: 15 },
            { x: 500, y: 220, width: 150, height: 15 },
            { x: 1000, y: 280, width: 200, height: 15 },
            { x: 1300, y: 200, width: 150, height: 15 },
            { x: 1750, y: 300, width: 180, height: 15 }
        ],
        crystals: [
            { x: 320, y: 250, width: 16, height: 20, collected: false },
            { x: 570, y: 170, width: 16, height: 20, collected: false },
            { x: 1080, y: 220, width: 16, height: 20, collected: false }
        ],
        enemies: [
            { x: 400, y: 368, width: 24, height: 32, minX: 150, maxX: 650, speed: 1.5, alive: true },
            { x: 1100, y: 368, width: 24, height: 32, minX: 850, maxX: 1350, speed: 1.8, alive: true }
        ],
        powerUps: [
            { x: 1000, y: 240, type: 'haste' }
        ]
    },
    {
        name: "Realm 2: The Crystal Spires",
        isBossLevel: false,
        bgGradient: ["#051c24", "#083344"],
        primaryColor: "#0e7490",
        secondaryColor: "#155e75",
        portalX: 2100, portalY: 120,
        platforms: [
            { x: 0, y: 400, width: 400, height: 50 },
            { x: 500, y: 320, width: 300, height: 20 },
            { x: 900, y: 250, width: 250, height: 20 },
            { x: 1250, y: 350, width: 400, height: 50 },
            { x: 1750, y: 250, width: 200, height: 20 },
            { x: 2000, y: 180, width: 200, height: 20 },
            { x: 1200, y: 180, width: 300, height: 15 }
        ],
        crystals: [
            { x: 620, y: 270, width: 16, height: 20, collected: false },
            { x: 1000, y: 190, width: 16, height: 20, collected: false },
            { x: 1350, y: 130, width: 16, height: 20, collected: false },
            { x: 1850, y: 190, width: 16, height: 20, collected: false }
        ],
        enemies: [
            { x: 150, y: 368, width: 24, height: 32, minX: 50, maxX: 350, speed: 2.0, alive: true },
            { x: 600, y: 288, width: 24, height: 32, minX: 520, maxX: 760, speed: 1.5, alive: true },
            { x: 1350, y: 318, width: 24, height: 32, minX: 1260, maxX: 1600, speed: 2.2, alive: true },
            { x: 1000, y: 100, width: 32, height: 32, minX: 800, maxX: 1200, speed: 2, type: 'flying', alive: true }
        ],
        powerUps: [
            { x: 1250, y: 310, type: 'doubleJump' }
        ]
    },
    {
        name: "Mid-Realm: The Gatekeeper",
        isBossLevel: true,
        bgGradient: ["#1e1b4b", "#312e81"],
        primaryColor: "#4338ca",
        secondaryColor: "#3730a3",
        platforms: [
            { x: 0, y: 400, width: 900, height: 50 },
            { x: 200, y: 290, width: 200, height: 15 },
            { x: 500, y: 230, width: 200, height: 15 }
        ],
        crystals: [],
        enemies: []
    },
    {
        name: "Realm 3: The Astral Citadel",
        isBossLevel: false,
        bgGradient: ["#18052b", "#31054a"],
        primaryColor: "#701a75",
        secondaryColor: "#4a044e",
        portalX: 2200, portalY: 320,
        platforms: [
            { x: 0, y: 400, width: 500, height: 50 },
            { x: 600, y: 300, width: 100, height: 15 },
            { x: 800, y: 220, width: 100, height: 15 },
            { x: 1000, y: 320, width: 100, height: 15 },
            { x: 1200, y: 400, width: 400, height: 50 },
            { x: 1350, y: 250, width: 200, height: 15 },
            { x: 1700, y: 280, width: 150, height: 15 },
            { x: 1950, y: 200, width: 150, height: 15 },
            { x: 2150, y: 400, width: 300, height: 50 }
        ],
        crystals: [
            { x: 640, y: 250, width: 16, height: 20, collected: false },
            { x: 840, y: 170, width: 16, height: 20, collected: false },
            { x: 1040, y: 270, width: 16, height: 20, collected: false },
            { x: 1400, y: 200, width: 16, height: 20, collected: false },
            { x: 1750, y: 230, width: 16, height: 20, collected: false }
        ],
        enemies: [
            { x: 200, y: 368, width: 24, height: 32, minX: 80, maxX: 450, speed: 2.5, alive: true },
            { x: 1300, y: 368, width: 24, height: 32, minX: 1210, maxX: 1550, speed: 2.5, alive: true },
            { x: 2250, y: 368, width: 24, height: 32, minX: 2160, maxX: 2400, speed: 3.0, alive: true },
            { x: 800, y: 100, width: 32, height: 32, minX: 600, maxX: 1000, speed: 2.5, type: 'flying', alive: true },
            { x: 1700, y: 150, width: 32, height: 32, minX: 1500, maxX: 1900, speed: 3, type: 'flying', alive: true }
        ],
        powerUps: []
    },
    {
        name: "Final Realm: Gorgon's Lair",
        isBossLevel: true,
        bgGradient: ["#2d0505", "#140101"],
        primaryColor: "#dc2626",
        secondaryColor: "#7f1d1d",
        platforms: [
            { x: 0, y: 400, width: 900, height: 50 },
            { x: 200, y: 290, width: 200, height: 15 },
            { x: 500, y: 230, width: 200, height: 15 }
        ],
        crystals: [],
        enemies: []
    }
];
