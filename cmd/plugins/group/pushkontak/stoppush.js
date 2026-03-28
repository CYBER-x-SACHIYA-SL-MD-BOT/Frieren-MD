/**
 * @module plugins/group/pushkontak/stoppush
 * @description Hentikan Broadcast
 */

let handler = async (m, { conn }) => {
    if (!global.isPushing) {
        return m.reply(`⚠️ *𝐍𝐎 𝐀𝐂𝐓𝐈𝐕𝐄 𝐏𝐑𝐎𝐂𝐄𝐒𝐒*

Tidak ada proses broadcast yang sedang berjalan saat ini.`)
    }
    
    global.stopPushRequest = true
    
    await conn.sendMessage(m.chat, { react: { text: '✋', key: m.key } })
    await m.reply(`✋ *𝐒𝐓𝐎𝐏 𝐑𝐄𝐐𝐔𝐄𝐒𝐓 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐃*

Sedang menghentikan antrian pengiriman... Mohon tunggu sebentar.`)
}

handler.help = ['stoppush']
handler.tags = ['owner']
handler.command = ['stoppush', 'stoppushkontak', 'stopbc']
handler.owner = true
handler.prefix = true

export default handler