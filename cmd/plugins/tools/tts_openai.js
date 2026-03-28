/**
 * @module plugins/tools/tts_openai
 * @description OpenAI TTS (Manual Emitter Style)
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
    
    // Config Options
    const voices = ['sage', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const styles = ['friendly', 'cheerful', 'sad', 'excited', 'terrified', 'shouting', 'unfriendly', 'whispering', 'hopeful']

    if (!input) {
        return m.reply(
            `╭───「 *${tiny('OPENAI VOICE')}* 」───\n` +
            `│\n` +
            `│ 🎙️ Kontrol emosi & gaya bicara.\n` +
            `│ 🎮 Format: ${usedPrefix + command} <voice>|<style>|<teks>\n` +
            `│\n` +
            `│ 🗣️ Voices:\n│ ${voices.join(', ')}\n` +
            `│\n` +
            `│ 🎭 Styles:\n│ ${styles.join(', ')}\n` +
            `│\n` +
            `╰────────────────────`
        )
    }

    let selectedVoice = 'sage'
    let selectedStyle = 'friendly'
    let query = input

    if (input.includes('|')) {
        const parts = input.split('|').map(p => p.trim())
        if (parts.length >= 3) {
            selectedVoice = voices.includes(parts[0].toLowerCase()) ? parts[0].toLowerCase() : 'sage'
            selectedStyle = styles.includes(parts[1].toLowerCase()) ? parts[1].toLowerCase() : 'friendly'
            query = parts.slice(2).join('|')
        }
    }

    await conn.sendMessage(m.chat, { react: { text: '🎙️', key: m.key } })

    try {
        const url = `https://anabot.my.id/api/ai/openAIFM?text=${encodeURIComponent(query)}&apikey=${API_KEY}&voice=${selectedVoice}&style=${selectedStyle}`
        const { data: res } = await axios.get(url, { timeout: 30000 })

        if (!res.success || !res.data?.result) throw new Error()

        await conn.sendMessage(m.chat, { 
            audio: { url: res.data.result }, 
            mimetype: 'audio/mpeg', 
            ptt: true 
        }, { quoted: m })

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        m.reply("❌ Gagal membuat audio OpenAI.")
    }
}

handler.help = ['ttso']
handler.tags = ['tools']
handler.command = ['ttso', 'openaitts']
handler.prefix = true

export default handler