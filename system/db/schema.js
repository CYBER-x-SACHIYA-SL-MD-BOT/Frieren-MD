import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // The key used in JSON (usually name or modified name)
    jid: { type: String, required: true },
    noId: String,
    ban: { type: Boolean, default: false },
    cmd: { type: Number, default: 0 },
    money: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    
    // Economy
    invest: {
        active: { type: Boolean, default: false },
        amount: { type: Number, default: 0 },
        dueDate: { type: Number, default: 0 }
    },
    crypto: {
        btc: { type: Number, default: 0 },
        eth: { type: Number, default: 0 },
        usdt: { type: Number, default: 0 }
    },

    // RPG
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    health: { type: Number, default: 100 },
    max_health: { type: Number, default: 100 },
    strength: { type: Number, default: 10 },
    defense: { type: Number, default: 10 },
    stamina: { type: Number, default: 100 },
    max_stamina: { type: Number, default: 100 },
    
    inventory: { type: Map, of: Number }, // flexible inventory
    rpg_assets: {
        sword: { type: Number, default: 0 },
        armor: { type: Number, default: 0 },
        pickaxe: { type: Number, default: 0 },
        axe: { type: Number, default: 0 },
        fishing_rod: { type: Number, default: 0 }
    },

    lastAdventure: { type: Number, default: 0 },
    lastHunt: { type: Number, default: 0 },
    lastMine: { type: Number, default: 0 },
    lastChop: { type: Number, default: 0 },
    
    jailExpired: { type: Number, default: 0 },
    
    ai: {
        bell: { type: Boolean, default: false },
        chat: { type: Number, default: 0 },
        role: { type: String, default: 'Gak Kenal' }
    }
}, { timestamps: true });

const GroupSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Group JID
    // Add other group fields as needed based on dataGc.json structure
    data: { type: mongoose.Schema.Types.Mixed } // Fallback for flexible structure
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Group = mongoose.model('Group', GroupSchema);

export { User, Group };
