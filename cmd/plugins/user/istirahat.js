/**
 * @module plugins/user/istirahat
 * @description Fitur untuk memulihkan HP dan Stamina secara perlahan (Resting System)
 */

import { Inventory } from '#system/inventory.js'
import { saveDb } from '#system/db/data.js'

let handler = async (m, { conn, isOwner }) => {
    const user = Inventory.getUser(m.sender)
    if (!user) return

    const now = Date.now()

    // 1. CEK APAKAH SEDANG ISTIRAHAT
    if (user.isResting) {
        // HITUNG PEMULIHAN SAAT BANGUN
        const durationMs = now - user.startRest
        const minutes = Math.floor(durationMs / 60000)

        if (minutes < 1) {
            return m.reply('💤 Anda baru saja merebahkan diri... Beristirahatlah minimal 1 menit untuk merasakan efeknya.')
        }

        // Recovery Rate
        const hpGain = minutes * 5
        const stamGain = minutes * 10

        user.health = Math.min(user.max_health, (user.health || 0) + hpGain)
        user.stamina = Math.min(user.max_stamina, (user.stamina || 0) + stamGain)
        
        user.isResting = false
        user.startRest = 0
        saveDb()

        return m.reply(`🌅 *SELAMAT PAGI!*
        
Anda telah beristirahat selama *${minutes} menit*.
❤️ HP Pulih: +${hpGain}
⚡ Stamina Pulih: +${stamGain}

_Status istirahat dicabut. Anda siap berpetualang lagi!_`)
    }

    // 2. MULAI ISTIRAHAT
    if (user.health >= user.max_health && user.stamina >= user.max_stamina) {
        return m.reply('🏃 Anda masih bugar! Tidak perlu istirahat saat ini.')
    }

    user.isResting = true
    user.startRest = now
    saveDb()

    const msg = `💤 *ANDA MULAI BERISTIRAHAT...*
    
Bot akan memulihkan HP & Stamina Anda secara perlahan.
❤️ +5 HP / menit
⚡ +10 Stamina / menit

_Ketik command ini lagi untuk bangun, atau kirim pesan apa saja._
*Selamat beristirahat, Partner.*`

    await conn.sendMessage(m.chat, { 
        text: msg,
        contextInfo: {
            externalAdReply: {
                title: "RESTING MODE",
                body: "Zzz... Zzz...",
                mediaType: 1,
                thumbnailUrl: 'https://c.termai.cc/i162/Ji3C.jpg',
                sourceUrl: '',
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.help = ['istirahat', 'tidur', 'rest']
handler.tags = ['rpg']
handler.command = ['istirahat', 'rest', 'tidur']
handler.prefix = true

export default handler
