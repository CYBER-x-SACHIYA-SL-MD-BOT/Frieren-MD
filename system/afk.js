import { db, saveDb } from './db/data.js'
import { grupify } from './sys.js'

export const msToTime = (duration) => {
  const milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  
  let str = ''
  if (hours > 0) str += `${hours} jam `
  if (minutes > 0) str += `${minutes} menit `
  if (seconds > 0) str += `${seconds} detik`
  return str.trim() || 'baru saja'
}

export const checkAfk = async (m, xp) => {
    const sender = m.key.participant || m.key.remoteJid
    const userKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid === sender)
    
    if (!userKey) return

    const user = db().key[userKey]

    // 1. Cek jika pengirim sedang AFK (Berhenti AFK)
    if (user.afkTime > -1) {
        const duration = msToTime(Date.now() - user.afkTime)
        const reason = user.afkReason || 'Tanpa alasan'
        
        user.afkTime = -1
        user.afkReason = ''
        user.isDnd = false // Reset DND
        saveDb()
        
        await xp.sendMessage(m.key.remoteJid, { 
            text: `👋 Selamat datang kembali @${sender.split('@')[0]}!\n\n📝 Alasan AFK: ${reason}\n⏳ Durasi: ${duration}`,
            mentions: [sender]
        }, { quoted: m })
    }

    // 2. Cek jika ada orang yang ditag sedang AFK
    const mentioned = m.mentionedJid || []
    for (const jid of mentioned) {
        const targetKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid === jid)
        if (targetKey) {
            const target = db().key[targetKey]
            if (target.afkTime > -1) {
                const duration = msToTime(Date.now() - target.afkTime)
                
                // LOGIKA DND (DO NOT DISTURB)
                if (target.isDnd) {
                    // Pengecualian: Bot boleh tag (untuk notif game/system)
                    const isBotSender = m.key.fromMe || sender.includes(xp.user.id.split(':')[0])
                    if (isBotSender) return 

                    // 1. Hapus pesan tag (jika bot admin)
                    const { botAdm } = await grupify(xp, m.key.remoteJid, m.key.participant || m.key.remoteJid)
                    if (botAdm) {
                        await xp.sendMessage(m.key.remoteJid, { delete: m.key }) 
                    }

                    // 2. Beri peringatan ke PENAG (Sender), bukan ke target
                    await xp.sendMessage(m.key.remoteJid, { 
                        text: `⚠️ @${sender.split('@')[0]} jangan tag dia!\n\n⛔ *DND ACTIVE* ⛔\nDia sedang tidak ingin diganggu.\n📝 Alasan: ${target.afkReason}`,
                        mentions: [sender] // Tag si pengirim, bukan target
                    })
                } else {
                    // AFK BIASA
                    await xp.sendMessage(m.key.remoteJid, { 
                        text: `🤫 Sstt... @${jid.split('@')[0]} sedang AFK!\n📝 Alasan: ${target.afkReason}\n⏳ Sejak: ${duration} yang lalu`,
                        mentions: [jid]
                    }, { quoted: m })
                }
            }
        }
    }
}
