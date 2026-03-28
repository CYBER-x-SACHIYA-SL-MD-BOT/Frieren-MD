/**
 * @module plugins/search/character
 * @description Character Search using Jikan API v4 (Stable & Official MAL Data)
 */

import axios from 'axios'

// Helper to Force HD Image (Remove MAL Resize params)
const getHDImage = (url) => {
    if (!url) return null;
    return url.replace(/\/r\/\d+x\d+/, '').split('?')[0];
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`🔍 Siapa nama karakter animenya?\nContoh: *${usedPrefix + command}* Yui Hirasawa`)

    await m.react('⏳')

    try {
        const { data } = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(text)}&limit=1`)
        
        if (!data.data || data.data.length === 0) {
            return m.reply('❌ Karakter tidak ditemukan.')
        }

        const char = data.data[0]
        const name = char.name
        const nameKanji = char.name_kanji || '-'
        const url = char.url
        
        // Priority: Large -> Normal -> Helper cleanup
        let imgRaw = char.images?.jpg?.large_image_url || char.images?.jpg?.image_url
        const img = getHDImage(imgRaw)

        let about = char.about || 'No description available.'

        // Basic Cleanup
        about = about.replace(/\\n/g, '\n')

        let caption = `◈ *CHARACTER PROFILE* ◈\n`
        caption += `──────────────────\n\n`
        caption += `◇ *Name*   : ${name}\n`
        caption += `◇ *Kanji*  : ${nameKanji}\n`
        if (char.nicknames && char.nicknames.length > 0) {
            caption += `◇ *Nick*   : ${char.nicknames.slice(0, 3).join(', ')}\n`
        }
        caption += `➜ *Link*   : ${url}\n\n`
        caption += `──────────────────\n`
        caption += `⬡ *ABOUT* \n\n`
        
        const limit = 800
        caption += about.length > limit ? about.substring(0, limit) + '...' : about

        await conn.sendMessage(m.chat, { 
            image: { url: img }, 
            caption: caption 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('Jikan API Error:', e.message)
        m.reply('❌ Gagal mengambil data (API Error).')
    }
}

handler.help = ['char <name>']
handler.tags = ['search', 'anime']
handler.command = ['char', 'character', 'charai']
handler.prefix = true

export default handler