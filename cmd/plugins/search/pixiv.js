/**
 * @module plugins/internet/pixiv
 * @description Pixiv search using HarzRestAPI
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`🎨 Masukkan kata kunci pencarian.\nContoh: *${usedPrefix + command}* Hatsune Miku`)
    
    await m.react('⏳')
    
    try {
        const response = await fetch(`https://api.harzrestapi.web.id/api/pixiv?q=${encodeURIComponent(text)}`)
        const res = await response.json()

        if (!res || !res.success || !res.data) {
            return m.reply('❌ Tidak ditemukan hasil untuk pencarian tersebut di Pixiv.')
        }

        const item = res.data
        const imgUrl = item.url || item.image
        
        const caption = `🎨 *PIXIV SEARCH*\n\n` +
                        `📝 *Title:* ${item.title || 'No Title'}\n` +
                        `👤 *Artist:* ${item.author || item.artist || 'Unknown'}\n` +
                        `🆔 *PID:* ${item.pid || item.id || '-'}\n` +
                        `🔗 *Link:* ${item.source || imgUrl}\n\n` +
                        `> _Powered by HarzRestAPI_`

        await conn.sendMessage(m.chat, { 
            image: { url: imgUrl }, 
            caption: caption 
        }, { quoted: m })
        
        await m.react('✅')

    } catch (e) {
        console.error('Pixiv Harz Error:', e)
        m.reply('❌ Terjadi kesalahan saat menghubungi server Pixiv.')
        await m.react('❌')
    }
}

handler.help = ['pixiv <query>']
handler.tags = ['internet']
handler.command = ['pixiv']
handler.prefix = true

export default handler
