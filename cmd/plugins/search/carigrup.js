/**
 * @module plugins/search/carigrup
 * @description Cari link grup WhatsApp (Manual Style)
 */

import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = text?.trim()
    const tiny = (t) => t.split('').map(c=>{
        const m = {
            'a': 'ᴀ',
            'b': 'ʙ',
            'c': 'ᴄ',
            'd': 'ᴅ',
            'e': 'ᴇ',
            'f': 'ꜰ',
            'g': 'ɢ',
            'h': 'ʜ',
            'i': 'ɪ',
            'j': 'ᴊ',
            'k': 'ᴋ',
            'l': 'ʟ',
            'm': 'ᴍ',
            'n': 'ɴ',
            'o': 'ᴏ',
            'p': 'ᴘ',
            'q': 'ǫ',
            'r': 'ʀ',
            's': 's',
            't': 'ᴛ',
            'u': 'ᴜ',
            'v': 'ᴠ',
            'w': 'ᴡ',
            'x': 'x',
            'y': 'ʏ',
            'z': 'ᴢ'
        };
        return m[c] || c
    }).join('')

    if (!query) {
        return m.reply(
            `╭───「 *${tiny('SEARCH GROUP')}* 」───\n` +
            `│\n` +
            `│ 🔎 Cari komunitas WhatsApp.\n` +
            `│ 🎮 Format: ${usedPrefix + command} <query>\n` +
            `│ 📝 Contoh: ${usedPrefix + command} mabar ml\n` +
            `│\n` +
            `╰────────────────────`
        )
    }
    
    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })
    
    try {
        const response = await axios.get(`https://api.denayrestapi.xyz/api/v1/search/wagc`, {
            params: { q: query },
            timeout: 30000
        })
        const data = response.data
        if (data.status !== 200 || !data.result?.length) return m.reply(`❌ Tidak ditemukan hasil untuk ${query}`)
        
        let txt = `╭───「 *${tiny('RESULT')}* 」───\n`
        txt += `│ 📝 Query: ${query.toUpperCase()}\n`
        txt += `│ 📊 Total: ${data.result.length} Grup\n`
        txt += `╰────────────────────\n\n`
        
        for (let i = 0; i < Math.min(data.result.length, 10); i++) {
            const item = data.result[i]
            let title = item.title || (item.link ? item.link.split('/').filter(Boolean).pop().replace(/-/g, ' ').toUpperCase() : `GRUP ${i + 1}`)
            txt += `*${i + 1}. ${title}*\n`
            txt += `🔗 ${item.link}\n\n`
        }
        
        if (data.result[0]?.image) {
            await conn.sendMessage(m.chat, { image: { url: data.result[0].image }, caption: txt.trim() }, { quoted: m })
        } else {
            await m.reply(txt.trim())
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    } catch (e) {
        m.reply("❌ Terjadi kesalahan pada sistem.")
    }
}

handler.help = ['carigrup']
handler.tags = ['search']
handler.command = ['carigrup', 'searchgrup', 'grupwa']
handler.prefix = true

export default handler
