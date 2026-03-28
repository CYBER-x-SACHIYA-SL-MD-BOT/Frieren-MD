/**
 * @module plugins/tools/tts3
 * @description TTS Alternative (Manual Emitter Style)
 */

import axios from 'axios'

const API_KEY = 'freeApikey'

let handler = async (m, { conn, text, usedPrefix, command }) => {
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
    let input = text || (m.quoted && (m.quoted.text || m.quoted.caption))
    
    if (!input) return m.reply(`╭───「 *${tiny('TTS ALTERNATIVE')}* 」───\n│\n│ 🗣️ Ubah teks jadi suara (V2).\n│ 🎮 Format: ${usedPrefix + command} <teks>\n│\n╰────────────────────`)

    await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } })

    try {
        const url = `https://anabot.my.id/api/ai/text2voice?text=${encodeURIComponent(input)}&apikey=${API_KEY}`
        const { data: res } = await axios.get(url, { timeout: 30000 })

        if (!res.success || !res.data?.result) throw new Error()

        await conn.sendMessage(m.chat, { 
            audio: { url: res.data.result }, 
            mimetype: 'audio/mpeg', 
            ptt: true 
        }, { quoted: m })

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        m.reply("❌ Gagal membuat audio.")
    }
}

handler.help = ['tts3']
handler.tags = ['tools']
handler.command = ['tts3', 'speak3']
handler.prefix = true

export default handler