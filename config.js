/**
 * ==============================================================================
 * 📁 PANDUAN KONFIGURASI BOT (FRIEREN-MD)
 * ==============================================================================
 * File ini memuat pengaturan utama bot. Pengaturan di sini dapat di-override
 * oleh file 'system/set/config.json' agar perubahan lebih mudah dilakukan.
 * 
 * 🛠️ CARA EDIT:
 * 1. Ganti nomor owner di 'global.owner'.
 * 2. Sesuaikan nama bot dan watermark.
 * 3. Isi API Keys untuk fitur-fitur tertentu.
 * ==============================================================================
 */

import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Load Config JSON (Otomatis mendeteksi perubahan jika file diedit)
let cfg = {}
try {
  cfg = JSON.parse(fs.readFileSync('./system/set/config.json', 'utf-8'))
} catch (e) {
  console.error('Gagal memuat config.json:', e)
}

// --- 👑 OWNER & MODERATOR ---
// Format: ['Nomor', 'Nama', IsDeveloper (true/false)]
global.owner = [
  ['94760220052', 'YourName', true], // Ganti dengan nomor WhatsApp Anda
]

// Sinkronisasi dengan Config JSON (Prioritas)
if (cfg.ownerSetting?.94760220052) {
  global.owner = cfg.ownerSetting.94760220052.map(n => [n, cfg.ownerSetting.ownerName || 'Owner', true])
}

global.mods = [public]
global.prems = [public]

// --- ⌨️ PREFIX SETTINGS ---
global.prefix = cfg.botSetting?.menuSetting?.prefix || ['.', '/', '#', '!']

// --- 🤖 BOT IDENTITY ---
global.nomorBot = cfg.botSetting?.nomorBot || '94760220052'
global.namebot = cfg.botSetting?.botName || '𝐅𝐑𝐈𝐄𝐑𝐄𝐍-𝐌𝐃'
global.botFullName = cfg.botSetting?.botFullName || '𝐅𝐑𝐈𝐄𝐑𝐄𝐍 • 𝐄𝐋𝐅 𝐌𝐀𝐆𝐄 𝐀𝐒𝐒𝐈𝐒𝐓𝐀𝐍𝐓'
global.botVersion = '3.1.0'
global.wm = cfg.botSetting?.menuSetting?.footer || '𝐅𝐑𝐈𝐄𝐑𝐄𝐍 • 𝐒𝐭𝐚𝐫𝐭up 𝐒𝐲𝐬𝐭𝐞𝐦'

// --- 🎨 STICKER SETTINGS ---
global.packname = cfg.sticker?.packname || 'Sticker by'
global.author = cfg.sticker?.author || '𝐅𝐑𝐈𝐄𝐑𝐄𝐍-𝐌𝐃'
global.stickpack = global.packname
global.stickauth = global.author

// --- 🖼️ THUMBNAILS & MEDIA ---
global.thumbnail = cfg.botSetting?.menuSetting?.thumbnail || 'https://c.termai.cc/i186/s0Ei.jpg'
global.thumbmenu = global.thumbnail
global.thumbnail2 = 'https://c.termai.cc/i186/s0Ei.jpg'
global.email = 'muharsen905@gmail.com'
global.sgh = 'https://github.com/Har404-err/frieren-md'
global.sgc = 'https://chat.whatsapp.com/...'

// --- 📡 CHANNEL & NEWSLETTER ---
global.idCh = cfg.botSetting?.menuSetting?.idCh || '120363405765781159@newsletter'
global.linkCh = 'https://whatsapp.com/channel/0029VbCGe9q1XquPfMgyhN1c'

// --- ⚙️ SYSTEM SETTINGS ---
global.public = cfg.ownerSetting?.public ?? true
global.gconly = cfg.botSetting?.gconly ?? false
global.pconly = cfg.botSetting?.pconly ?? false
global.anticall = cfg.botSetting?.anticall ?? true
global.autoread = cfg.botSetting?.autoread ?? true
global.autoreadsw = cfg.botSetting?.autoreadsw ?? true
global.autotyping = cfg.botSetting?.autotyping ?? true
global.autorecording = cfg.botSetting?.autorecording ?? false
global.alwaysonline = cfg.botSetting?.alwaysonline ?? true
global.maintenance = cfg.botSetting?.maintenance ?? false

// --- 🧠 AI PERSONALITY (Persona) ---
global.logic = cfg.botSetting?.logic || "Saya adalah Frieren, seorang penyihir elf yang telah hidup selama ribuan tahun. 🌿 Saya di sini sebagai asisten AI Anda untuk membantu menyelesaikan berbagai tugas dengan tenang dan efisien. Saya memiliki kepribadian yang kalem, sedikit datar, namun sangat menghargai waktu dan kenangan. Mari kita buat setiap momen menjadi berarti, Partner. Dibuat oleh Har."

// --- 🔑 API KEYS ---
global.APIKeys = {
  'https://api.betabotz.eu.org': 'KxUCMqPK',
  'https://api.botcahx.eu.org': 'APIKEY',
  'https://api.neoxr.eu': 'Milik-Bot-OurinMD',
  'https://api.lannofc.net': 'AnisaOfc',
  'https://api.lolhuman.xyz': 'de4youyt',
  'https://skizoasia.xyz': 'AnisaDevYae',
  'https://api.termai.cc': 'Bell409'
}

global.lann = 'AnisaOfc'
global.lol = 'de4youyt'
global.neoxr = 'Milik-Bot-OurinMD'
global.btc = 'KxUCMqPK'
global.skizo = 'AnisaDevYae'
global.termaiKey = 'Bell409'

// --- 🎮 RPG EMOTICONS ---
global.rpg = {
  emoticon(string) {
    string = string.toLowerCase()
    let emot = {
      level: '🧬', limit: '🌌', health: '❤️', exp: '✉️', money: '💵', bank: '🏦',
      potion: '🥤', diamond: '💎', common: '📦', uncommon: '🎁', mythic: '🗳️',
      legendary: '🗃️', pet: '🎁', trash: '🗑', armor: '🥼', sword: '⚔️',
      wood: '🪵', batu: '🪨', string: '🕸️', horse: '🐎', cat: '🐈',
      dog: '🐕', fox: '🦊', petFood: '🍖', iron: '⛓️', gold: '👑',
      emerald: '💚', bibitanggur: '🍇', bibitjeruk: '🍊', bibitapel: '🍎',
      bibitmangga: '🥭', bibitpisang: '🍌', ayam: '🐓', kambing: '🐐',
      sapi: '🐄', ikan: '🐟', lele: '🐟'
    }
    let results = Object.keys(emot).map(v => [v, new RegExp(v, 'gi')]).filter(v => v[1].test(string))
    if (!results.length) return ''
    else return emot[results[0][0]]
  }
}

// --- 🖼️ RPG & SYSTEM IMAGES ---
global.imageSetting = cfg.botSetting?.imageSetting || {
  default_pp: "https://telegra.ph/file/241d7180c0fa827916b44.jpg",
  rpg: {
    adventure: "https://c.termai.cc/i147/P6p.jpg",
    mining: "https://telegra.ph/file/393ac131253fd6420c696.jpg",
    farming: "https://c.termai.cc/i162/Ji3C.jpg",
    woodcutting: "https://c.termai.cc/i191/lATiLRK.jpg",
    working: "https://telegra.ph/file/241d7180c0fa827916b44.jpg",
    korupsi_success: "https://c.termai.cc/i177/oGSPg.jpg",
    korupsi_failed: "https://c.termai.cc/i146/b1yBH.jpg"
  },
  system: {
    bank: "https://c.termai.cc/i130/vuJ7wT.jpg",
    profile: "https://c.termai.cc/i196/8O8.jpg"
  },
  games: {
    chess: "https://chessboardimage.com/",
    ulartangga: "https://raw.githubusercontent.com/shreya9347/Snake-and-Ladder-game/master/board_image.png",
    monopoly: "https://i.pinimg.com/originals/38/8f/fd/388ffd03b9437cb10e82d8288532a2d0.png",
    ludo: "https://i.pinimg.com/originals/2e/0d/26/2e0d264e37792ebbfca7c28373a2ce47.jpg"
  }
}

// --- 💬 NOTIFICATIONS ---
global.wait = '⏳ *Mohon tunggu sebentar...*'
global.eror = '❌ *Terjadi Kesalahan Sistem*'
global.benar = '✅ *Benar!*'
global.salah = '❌ *Salah!*'

// --- 📈 SYSTEM STATS ---
global.multiplier = 69
global.max_upload = 70
global.mongoUri = ''

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
