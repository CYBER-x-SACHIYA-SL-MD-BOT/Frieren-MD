import { db, saveDb } from '../../../system/db/data.js'

export default function userStatus(ev) {
  ev.on({
    name: 'afk',
    cmd: ['afk'],
    tags: 'Main Menu',
    desc: 'Set status menjadi AFK',
    run: async (xp, m, { args, chat }) => {
        try {
            const sender = m.key.participant || m.key.remoteJid
            const userKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid?.includes(sender.split('@')[0]))
            
            if (!userKey) return xp.sendMessage(chat.id, { text: 'Kamu belum terdaftar di database.' }, { quoted: m })

            const reason = args.join(' ') || 'Tanpa alasan'
            db().key[userKey].afkTime = Date.now()
            db().key[userKey].afkReason = reason
            saveDb()

            const time = global.time.timeIndo()
            const displayName = m.pushName || m.sender.split('@')[0]
            
            xp.sendMessage(chat.id, { 
                text: `┌  「 *AFK MODE* 」\n│\n├  👤 *Nama:* ${displayName}\n├  📝 *Alasan:* ${reason}\n├  ⏰ *Waktu:* ${time}\n│\n└  _Kirim pesan lagi untuk berhenti AFK_`,
                mentions: [sender]
            }, { quoted: m })

        } catch (e) {
            console.error('error pada afk', e)
        }
    }
  })

  ev.on({
    name: 'dnd',
    cmd: ['dnd', 'fokus', 'sibuk'],
    tags: 'Main Menu',
    desc: 'Mode Jangan Ganggu (Do Not Disturb)',
    run: async (xp, m, { args, chat }) => {
        try {
            const sender = m.key.participant || m.key.remoteJid
            const userKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid?.includes(sender.split('@')[0]))
            
            if (!userKey) return xp.sendMessage(chat.id, { text: 'Kamu belum terdaftar.' }, { quoted: m })

            const reason = args.join(' ') || 'Sibuk banget'
            db().key[userKey].afkTime = Date.now()
            db().key[userKey].afkReason = reason
            db().key[userKey].isDnd = true 
            saveDb()

            const displayName = m.pushName || m.sender.split('@')[0]

            m.reply(`⛔ *${displayName}* mengaktifkan mode *DND*!\n📝 Alasan: ${reason}\n\n_Pesan yang men-tag dia akan dihapus!_`, { mentions: [sender] })

        } catch (e) {
            console.error('error pada dnd', e)
        }
    }
  })

  ev.on({
    name: 'ceklimit',
    cmd: ['ceklimit', 'limit', 'ceklimitku'],
    tags: 'Main Menu',
    desc: 'Cek sisa limit harian & status akun',
    run: async (xp, m, { chat }) => {
        const sender = m.key.participant || m.key.remoteJid
        const userKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid?.includes(sender.split('@')[0]))
        if (!userKey) return m.reply('❌ Kamu belum terdaftar di database.\nKetik *.verify* untuk mendaftar.')
        
        const user = db().key[userKey]
        const limit = user.limit
        const level = user.level || 1
        const role = user.role || 'Warga Sipil'
        const xpPoints = user.exp || 0
        
        // --- Limit Calculation ---
        const max = 50 // Base max reference
        const percentage = Math.min(100, Math.max(0, Math.floor((limit / max) * 100)))
        const filled = Math.floor(percentage / 10)
        const empty = 10 - filled
        const bar = '▓'.repeat(filled) + '░'.repeat(empty)
        const percentStr = `${percentage}%`

        const txt = `╭──〔 *STATUS LIMIT* 〕───⬣
│
│ 👤 *User:* ${m.pushName || 'Kak'}
│ 🏅 *Role:* ${role}
│ 🆙 *Level:* ${level} (${xpPoints} XP)
│
├─〔 *SISA LIMIT* 〕
│
│ ${bar} ${percentStr}
│ ⚡ *Limit:* ${limit}
│
╰───────────────────⬣

💡 _Tips: Limit akan direset setiap jam 00:00 WIB._`

        // Send with ad reply context if possible, otherwise simple text
        await xp.sendMessage(chat.id, { 
            text: txt,
            contextInfo: {
                externalAdReply: {
                    title: `Limit: ${limit}`,
                    body: "Mars Bot Assistant",
                    thumbnailUrl: "https://telegra.ph/file/5144b931936c53e87569f.jpg", 
                    sourceUrl: "https://chat.whatsapp.com/...", // Link group bot or website
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            } 
        }, { quoted: m })
    }
  })
}