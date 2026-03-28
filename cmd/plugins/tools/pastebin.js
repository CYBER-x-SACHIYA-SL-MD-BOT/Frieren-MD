/**
 * @module plugins/tools/pastebin
 * @description Upload teks/kode ke Pastebin (Unlisted)
 */

import axios from 'axios'

const API_KEY = 'EkuAJ3E7KLAcgzdcl4TZPO1SGX5eiPoL' // Pastebin API Key

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const tiny = (t) => t.split('').map(c=>{
        const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};
        return m[c]||c
    }).join('')

    let title = 'Untitled'
    let content = ''

    if (m.quoted && m.quoted.text) {
        content = m.quoted.text
        if (text) title = text // Arg as title
    } else if (text) {
        if (text.includes('|')) {
            const parts = text.split('|')
            title = parts[0]
            content = parts.slice(1).join('|')
        } else {
            // Assume single line arg is title, wait... user can't send content without pipe?
            // Fallback: entire text is content
            content = text
        }
    }

    if (!content) {
        return m.reply(
            `╭───「 *${tiny('PASTEBIN UPLOAD')}* 」───\n` +
            `│\n` +
            `│ 📝 Upload kode/teks ke Pastebin.\n` +
            `│ 🎮 Format: ${usedPrefix + command} judul|isi_teks\n` +
            `│ ↩️ Atau Reply pesan dengan caption: ${usedPrefix + command} judul\n` +
            `│\n` +
            `╰────────────────────`
        )
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    try {
        const pasteUrl = 'https://pastebin.com/api/api_post.php'
        const form = new URLSearchParams()
        form.append('api_dev_key', API_KEY)
        form.append('api_option', 'paste')
        form.append('api_paste_code', content.trim())
        form.append('api_paste_name', title.trim() || 'Untitled')
        form.append('api_paste_expire_date', 'N') // Never expire
        form.append('api_paste_private', '1') // Unlisted

        const { data } = await axios.post(pasteUrl, form)

        if (!data || data.includes('Bad API request')) {
            throw new Error(data || 'Bad Request')
        }

        let txt = `╭───「 *${tiny('PASTEBIN SUCCESS')}* 」───\n`
        txt += `│\n`
        txt += `│ 🏷️ Judul: ${title.trim()}\n`
        txt += `│ 🔗 Link: ${data}\n`
        txt += `│\n`
        txt += `╰────────────────────`

        await m.reply(txt)
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        console.error(e)
        m.reply("❌ Gagal upload ke Pastebin (API Key Limit/Error).")
    }
}

handler.help = ['pastebin <judul>|<teks>']
handler.tags = ['tools']
handler.command = ['pastebin', 'paste']
handler.prefix = true

export default handler
