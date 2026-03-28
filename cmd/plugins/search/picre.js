/**
 * @module plugins/fun/picre
 * @description Random Anime Image from Pic.re
 */

let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } })

    try {
        // Add random param to avoid cache
        const url = `https://pic.re/image?v=${Date.now()}`
        
        await conn.sendMessage(m.chat, { 
            image: { url }, 
            caption: '🖼️ *Random Anime Image*'
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal mengambil gambar.')
    }
}

handler.help = ['picre']
handler.tags = ['fun', 'anime']
handler.command = ['picre', 'randomanime']
handler.limit = true

export default handler