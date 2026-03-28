/**
 * @module plugins/tools/shorturl
 * @description URL Shortener (TinyURL & Is.gd)
 */

import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Linknya mana?
Contoh: *${usedPrefix + command}* https://google.com`)
    
    if (!/^https?:\/\//.test(text)) return m.reply('❌ Masukkan URL yang valid (awali dengan http/https).')

    await m.react('⏳')

    try {
        // 1. Try TinyURL
        const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`)
        if (tiny.data) {
            return m.reply(`✅ *Short URL Created!*

🔗 Short: ${tiny.data}`)
        }
    } catch (e) {
        console.error('TinyURL Fail:', e.message)
        
        // 2. Fallback to Is.gd
        try {
            const isgd = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(text)}`)
            if (isgd.data) {
                return m.reply(`✅ *Short URL Created!*

🔗 Short: ${isgd.data}`)
            }
        } catch (e2) {
            console.error('Is.gd Fail:', e2.message)
            m.reply('❌ Gagal memendekkan URL.')
        }
    }
}

handler.help = ['short <url>']
handler.tags = ['tools']
handler.command = ['short', 'shorturl', 'pendek']
handler.limit = true

export default handler