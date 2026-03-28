/**
 * @module plugins/tools/tts2
 * @description TTS Pro Models (Manual Emitter Style)
 */

import axios from 'axios'

const API_KEY = 'freeApikey'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
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
    const models = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    
    if (!input) {
        return m.reply(
            `╭───「 *${tiny('TTS PRO')}* 」───\n` +
            `│\n` +
            `│ 🎙️ Pilihan Model Suara:\n` +
            `│ ${models.join(', ')}\n` +
            `│\n` +
            `│ 🎮 Format: ${usedPrefix + command} <model> <teks>\n` +
            `│\n` +
            `╰────────────────────`
        )
    }

    const model = args[0]?.toLowerCase()
    let query = input

    if (models.includes(model)) {
        query = args.slice(1).join(' ')
        if (!query) return m.reply(`❌ Masukkan teks setelah model!`)
    } else {
        // Default echo if model not found in first arg
        query = input
    }

    await conn.sendMessage(m.chat, { react: { text: '🎙️', key: m.key } })

    try {
        const selectedModel = models.includes(model) ? model : 'echo'
        const url = `https://anabot.my.id/api/ai/text2speech_2?text=${encodeURIComponent(query)}&models=${selectedModel}&apikey=${API_KEY}`
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

handler.help = ['tts2']
handler.tags = ['tools']
handler.command = ['tts2', 'speak2']
handler.prefix = true

export default handler