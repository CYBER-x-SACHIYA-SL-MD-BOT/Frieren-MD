import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pino from 'pino'
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const baileys = require('@adiwajshing/baileys')
const makeWASocket = baileys.default || baileys
const { useMultiFileAuthState, DisconnectReason } = baileys

import { handleCmd } from '../cmd/handle.js'
import { cleanMsg, replaceLid, saveLidCache } from './function.js'
import { antiDelaySystem } from './antidelay.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionDir = path.join(__dirname, '../connect/jadibot')

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true })
}

const jadibots = {}
const logLevel = pino({ level: 'silent' })

const makeSimpleStore = () => {
  const msg = {},
        loadMessage = async (remoteJid, id) =>
          msg[remoteJid]?.find(m => m.key?.id === id) || null,
        bind = ev => {
          ev.on('messages.upsert', ({ messages }) => {
            if (!Array.isArray(messages)) return
            for (const m of messages) {
              const jid = m.key?.remoteJid
              if (!jid) continue
              const arr = msg[jid] ||= []
              if (!arr.find(x => x.key?.id === m.key?.id)) {
                arr.push(m)
                if (arr.length > 100) arr.shift()
              }
            }
          })
        }

  return { bind, loadMessage }
}

const saveJadibotList = () => {
    const list = Object.keys(jadibots).map(k => ({
        id: k,
        isPremium: jadibots[k].isPremium,
        expire: jadibots[k].expire
    }))
    fs.writeFileSync(path.join(sessionDir, 'list.json'), JSON.stringify(list))
}

const loadJadibotList = () => {
    const listPath = path.join(sessionDir, 'list.json')
    if (fs.existsSync(listPath)) {
        return JSON.parse(fs.readFileSync(listPath, 'utf8'))
    }
    return []
}

export const startJadibot = async (xp, m, phoneNumber, customExpireDays = null) => {
    try {
        const id = phoneNumber.replace(/[^0-9]/g, '')
        const botSessionDir = path.join(sessionDir, id)
        
        if (!fs.existsSync(botSessionDir)) {
            fs.mkdirSync(botSessionDir, { recursive: true })
        }

        const { state, saveCreds } = await useMultiFileAuthState(botSessionDir)
        const isSessionExist = fs.existsSync(path.join(botSessionDir, 'creds.json'))
        const store = makeSimpleStore()

        const sock = makeWASocket({
            logger: logLevel,
            version: [2, 3000, 1033936837], 
            browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
            connectTimeoutMs: 60000, 
            keepAliveIntervalMs: 30000, 
            auth: state, 
            printQRInTerminal: false,
            syncFullHistory: false
        })

        store.bind(sock.ev)

        if (!isSessionExist || !state.creds.me || !state.creds.registered) {
            await new Promise(r => setTimeout(r, 2000))
            try {
                const code = await sock.requestPairingCode(id)
                const formattedCode = (code || '').match(/.{1,4}/g)?.join('-') || code
                if (xp && m) {
                    await xp.sendMessage(m.chat, { 
                        text: `*JADIBOT - PAIRING CODE*\n\nNomor: ${id}\nKode: *${formattedCode}*\n\n_Masukkan kode ini di WhatsApp perangkat target (Tautkan Perangkat > Tautkan dengan Nomor Telepon)._` 
                    }, { quoted: m })
                }
            } catch (err) {
                console.error('Jadibot Pairing Error:', err)
                if (m) return m.reply(`❌ Gagal meminta pairing code untuk ${id}. Pastikan nomor aktif di WhatsApp.`)
            }
        } else {
             if (m) m.reply(`✅ Menghubungkan ulang sesi Jadibot untuk ${id}...`)
        }

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(`Jadibot ${id} disconnected, reconnecting...`)
                    setTimeout(() => startJadibot(xp, m, id, customExpireDays), 5000)
                } else {
                    console.log(`Jadibot ${id} logged out.`)
                    delete jadibots[id]
                    saveJadibotList()
                    fs.rmSync(botSessionDir, { recursive: true, force: true })
                    if (xp && m) xp.sendMessage(m.chat, { text: `⚠️ Jadibot ${id} telah terputus/logout.` })
                }
            } else if (connection === 'open') {
                console.log(`Jadibot ${id} connected!`)
                
                if (!jadibots[id]) jadibots[id] = {}
                jadibots[id].sock = sock

                // Jika ada customExpireDays yang dilempar dari command (baru/update)
                if (customExpireDays !== null) {
                    if (customExpireDays === 'permanen') {
                        jadibots[id].isPremium = true
                        jadibots[id].expire = null
                    } else {
                        jadibots[id].isPremium = false
                        jadibots[id].expire = Date.now() + (customExpireDays * 24 * 60 * 60 * 1000)
                    }
                } 
                // Jika belum diset sama sekali (default 2 hari untuk free user)
                else if (jadibots[id].expire === undefined && !jadibots[id].isPremium) {
                    jadibots[id].isPremium = false
                    jadibots[id].expire = Date.now() + (2 * 24 * 60 * 60 * 1000)
                }

                saveJadibotList()
                if (xp && m) xp.sendMessage(m.chat, { text: `✅ Jadibot ${id} berhasil terhubung!` })
            }
        })

        // Handling Messages for Jadibot
        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (let msg of messages) {
                if (msg.key.fromMe) continue
                if (msg.key.remoteJid.endsWith('@newsletter')) return
                if (msg.key.remoteJid === 'status@broadcast') return

                // Check Expiration for free/rent users
                if (!jadibots[id]?.isPremium && jadibots[id]?.expire && Date.now() > jadibots[id].expire) {
                     stopJadibot(id)
                     return
                }

                msg = cleanMsg(msg)
                msg = replaceLid(msg)
                
                // Ensure methods are injected safely
                try {
                    if (Object.isFrozen(msg) || !Object.isExtensible(msg)) {
                        const originalMsg = msg
                        msg = { ...originalMsg }
                        if (originalMsg.key) msg.key = originalMsg.key
                        if (originalMsg.message) msg.message = originalMsg.message
                    }
                    msg.reply = (text, options = {}) => sock.sendMessage(msg.key.remoteJid, { text, ...options }, { quoted: msg })
                    msg.react = (text) => sock.sendMessage(msg.key.remoteJid, { react: { text, key: msg.key } })
                } catch (e) {
                    console.error('Jadibot Method Injection Error:', e.message)
                }

                // Panggil handleCmd yang sama dengan main bot
                handleCmd(msg, sock, store).catch(e => console.error(`Jadibot ${id} handleCmd error:`, e))
            }
        })

    } catch (error) {
        console.error('Jadibot Error:', error)
    }
}

export const stopJadibot = async (phoneNumber) => {
    const id = phoneNumber.replace(/[^0-9]/g, '')
    if (jadibots[id]) {
        try {
            jadibots[id].sock.logout()
        } catch(e) {}
        delete jadibots[id]
        saveJadibotList()
        const botSessionDir = path.join(sessionDir, id)
        if (fs.existsSync(botSessionDir)) {
            fs.rmSync(botSessionDir, { recursive: true, force: true })
        }
        return true
    }
    return false
}

export const getJadibots = () => {
    return Object.keys(jadibots).map(k => ({
        id: k,
        isPremium: jadibots[k].isPremium,
        expire: jadibots[k].expire
    }))
}

export const loadAllJadibots = () => {
    const list = loadJadibotList()
    for (const bot of list) {
        if (!jadibots[bot.id]) jadibots[bot.id] = {}
        jadibots[bot.id].isPremium = bot.isPremium
        jadibots[bot.id].expire = bot.expire
        
        // Mock m & xp for auto-reconnect, passing null for customExpireDays to use existing data
        startJadibot(null, null, bot.id, null)
    }
}