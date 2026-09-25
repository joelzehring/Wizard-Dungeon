export const COSMETICS_CATALOG = {
    robe: [
        { id: 'violet_classic', name: 'Apprentice Violet', costType: 'crystals', cost: 0, color: '#8b5cf6', hatColor: '#4c1d95', desc: 'Standard issue wizard robe.' },
        { id: 'archmage_blue', name: 'Sapphire Archmage', costType: 'crystals', cost: 5, color: '#2563eb', hatColor: '#1e40af', desc: 'Worn by masters of the Frost Spire.' },
        { id: 'flame_crimson', name: 'Pyroclastic Red', costType: 'crystals', cost: 10, color: '#dc2626', hatColor: '#991b1b', desc: 'Imbued with eternal fire magic.' },
        { id: 'emerald_druid', name: 'Forest Druid', costType: 'crystals', cost: 15, color: '#16a34a', hatColor: '#14532d', desc: 'Woven from ancient enchanted leaves.' },
        { id: 'shadow_void', name: 'Void Walker', costType: 'stars', cost: 1, color: '#312e81', hatColor: '#1e1b4b', desc: 'Woven from shadow rift energy.' },
        { id: 'golden_sun', name: 'Solar Monarch', costType: 'stars', cost: 2, color: '#eab308', hatColor: '#854d0e', desc: 'Radiates with pure stellar light.' },
        { id: 'cyber_neon', name: 'Neon Cyberpunk', costType: 'stars', cost: 3, color: '#06b6d4', hatColor: '#0891b2', desc: 'Futuristic mana-infused weave.' },
        { id: 'rainbow_prismatic', name: 'Prismatic Rainbow', costType: 'stars', cost: 5, color: 'rainbow', hatColor: '#ec4899', desc: 'Constantly cycles through cosmic colors.' }
    ],
    hat: [
        { id: 'classic_hat', name: 'Apprentice Cone', costType: 'crystals', cost: 0, desc: 'Classic pointed wizard hat.' },
        { id: 'starry_cap', name: 'Cosmic Night Cap', costType: 'crystals', cost: 8, desc: 'Adorned with glowing golden stars.' },
        { id: 'archmage_crown', name: 'Golden Archmage Crown', costType: 'crystals', cost: 12, desc: 'Regal crown set with a glowing gem.' },
        { id: 'witch_brim', name: 'Sorceress Brim', costType: 'crystals', cost: 18, desc: 'Stylish wide-brimmed witch hat.' },
        { id: 'horned_helm', name: 'Demon Horn Helm', costType: 'stars', cost: 2, desc: 'Forged in dragonfire with curved horns.' },
        { id: 'royal_tiara', name: 'Emerald Tiara', costType: 'stars', cost: 3, desc: 'Elegant tiara gleaming with nature energy.' },
        { id: 'bunny_ears', name: 'Magical Bunny Ears', costType: 'stars', cost: 4, desc: 'Soft ears that twitch with spell power!' }
    ],
    staff: [
        { id: 'oak_wand', name: 'Apprentice Oak Staff', costType: 'crystals', cost: 0, desc: 'Sturdy wooden staff topped with a green gem.' },
        { id: 'crystal_scepter', name: 'Cyan Crystal Scepter', costType: 'crystals', cost: 10, desc: 'Gleaming crystal focus node.' },
        { id: 'flaming_torch', name: 'Pyromancer Torch', costType: 'crystals', cost: 20, desc: 'Continuously burns with elemental flame.' },
        { id: 'star_scepter', name: 'Starfall Wand', costType: 'stars', cost: 2, desc: 'Topped with a spinning golden star.' },
        { id: 'shadow_blade', name: 'Void Scythe Staff', costType: 'stars', cost: 4, desc: 'Channel dark rift magic through this blade.' },
        { id: 'celestial_orb', name: 'Celestial Orb Staff', costType: 'stars', cost: 5, desc: 'A floating magical orb hovers at its tip.' }
    ],
    aura: [
        { id: 'none', name: 'No Aura', costType: 'crystals', cost: 0, desc: 'No special aura effect.' },
        { id: 'sparkle_dust', name: 'Glitter Sparkle', costType: 'crystals', cost: 12, desc: 'Glittering stardust floats around you.' },
        { id: 'fire_flame', name: 'Inferno Flames', costType: 'crystals', cost: 22, desc: 'Fiery embers rise around your wizard.' },
        { id: 'void_smoke', name: 'Shadow Void Wisps', costType: 'stars', cost: 3, desc: 'Swirling dark void particles.' },
        { id: 'rainbow_glow', name: 'Prismatic Rainbow Aura', costType: 'stars', cost: 5, desc: 'Radiates a shifting rainbow circle.' }
    ]
};

const STORAGE_KEY = 'wizard_dungeon_cosmetics_v1';

export function loadCosmeticsState() {
    const defaultState = {
        crystals: 0,
        stars: 0,
        equipped: {
            robe: 'violet_classic',
            hat: 'classic_hat',
            staff: 'oak_wand',
            aura: 'none'
        },
        unlocked: ['violet_classic', 'classic_hat', 'oak_wand', 'none']
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                crystals: typeof parsed.crystals === 'number' ? parsed.crystals : defaultState.crystals,
                stars: typeof parsed.stars === 'number' ? parsed.stars : defaultState.stars,
                equipped: { ...defaultState.equipped, ...(parsed.equipped || {}) },
                unlocked: Array.isArray(parsed.unlocked) ? Array.from(new Set([...defaultState.unlocked, ...parsed.unlocked])) : defaultState.unlocked
            };
        }
    } catch (e) {
        console.warn('Could not load cosmetics state from localStorage', e);
    }

    return defaultState;
}

export function saveCosmeticsState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save cosmetics state to localStorage', e);
    }
}
