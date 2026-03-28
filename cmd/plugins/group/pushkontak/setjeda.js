/**
 * @module plugins/group/pushkontak/setjeda
 * @description Konfigurasi Delay Broadcast
 */

import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const settings = db().settings || {}
    
    const currentJedaPush = settings.jedaPush || 5000
    const currentJedaJpm = settings.jedaJpm || 5000
    
    if (args.length < 2) {
        return m.reply(
            `⏱️ *𝐃𝐄𝐋𝐀𝐘 𝐂𝐎𝐍𝐅𝐈𝐆𝐔𝐑𝐀𝐓𝐈𝐎𝐍*\n\n` +
            `🔹 *Current Settings:*
` +
            `├ Push Kontak: ${currentJedaPush}ms
` +
            `└ JPM Broadcast: ${currentJedaJpm}ms

` +
            `🔹 *Usage:*
` +
            `├ ${usedPrefix + command} push <ms>
` +
            `└ ${usedPrefix + command} jpm <ms>

` +
            `_Note: 1000ms = 1 detik_`
        )
    }
    
    const target = args[0].toLowerCase()
    const value = parseInt(args[1])
    
    if (!['push', 'jpm'].includes(target)) return m.reply(`⚠️ Target salah. Gunakan 'push' atau 'jpm'.`)
    if (isNaN(value) || value < 1000) return m.reply(`⚠️ Nilai delay minimal 1000ms (1 detik).`)
    if (value > 300000) return m.reply(`⚠️ Nilai delay maksimal 300000ms (5 menit).`)
    
    if (target === 'push') {
        db().settings.jedaPush = value
        saveDb()
        m.reply(`✅ *Push Delay Updated: ${value}ms*`)
    } else {
        db().settings.jedaJpm = value
        saveDb()
        m.reply(`✅ *JPM Delay Updated: ${value}ms*`)
    }
}

handler.help = ['setjeda <type> <ms>']
handler.tags = ['owner']
handler.command = ['setjeda', 'setdelay', 'jeda']
handler.owner = true
handler.prefix = true

export default handler