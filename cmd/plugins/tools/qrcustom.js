/**
 * @module plugins/tools/qrcustom
 * @description QR Code Generator dengan Logo (Manual Style & Centralized Uploader)
 */

import axios from 'axios'
import { uploader } from '#system/lib/uploader.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const tiny = (t) => t.split('').map(c=>{const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};return m[c]||c}).join('')
    
    // Parse Input: text|url
    let [query, urlInput] = text ? text.split('|') : []
    query = query?.trim()
    urlInput = urlInput?.trim()

    if (!query) {
        return m.reply(
            `╭───「 *${tiny('QR CUSTOM')}* 」───\n` +
            `│\n` +
            `│ 📱 Buat QR Code dengan logo.
` +
            `│ 🎮 Format: ${usedPrefix + command} <text>|<url_gambar>
` +
            `│ 📝 Contoh: ${usedPrefix + command} https://google.com
` +
            `│\n` +
            `│ 💡 Tips: Bisa juga reply gambar tanpa link.
` +
            `│\n` +
            `╰────────────────────`
        )
    }

    try {
        let imageUrl = urlInput || ''
        
        // --- HANDLE REPLY IMAGE ---
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        
        if (!imageUrl && /image/.test(mime)) {
            await conn.sendMessage(m.chat, { react: { text: '🆙', key: m.key } })
            
            // Fixed Download Object
            const msgToDownload = {
                key: q.key,
                message: q.message || { [q.mtype]: q.msg }
            }
            const buffer = await downloadMediaMessage(msgToDownload, 'buffer')
            
            // Use CENTRALIZED Uploader (Catbox/Termai/Telegra fallback)
            imageUrl = await uploader(buffer)
            if (!imageUrl) return m.reply("❌ Gagal upload logo. Semua server uploader sedang sibuk.")
        }
        
        await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })
        
        // --- GENERATE QR (DenayAPI) ---
        const apiUrl = imageUrl 
            ? `https://api.denayrestapi.xyz/api/v1/tools/qrcustom?data=${encodeURIComponent(query)}&type=png&size=500&image=${encodeURIComponent(imageUrl)}` 
            : `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(query)}`
        
        // --- SEND RESULT (EMITTER STYLE) ---
        let caption = `╭───「 *${tiny('QR GENERATED')}* 」───\n`
        caption += `│\n`
        caption += `│ 📄 Isi: ${query.length > 30 ? query.substring(0,30)+'...' : query}
`
        caption += `│ 💠 Logo: ${imageUrl ? 'Added  ✅' : 'No Logo'}
`
        caption += `│\n`
        caption += `╰────────────────────`

        await conn.sendMessage(m.chat, { 
            image: { url: apiUrl }, 
            caption: caption 
        }, { quoted: m })
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        console.error(e)
        m.reply("❌ Gagal membuat QR Code.")
    }
}

handler.help = ['qrcustom']
handler.tags = ['tools']
handler.command = ['qrcustom', 'qrcode', 'qr']
handler.prefix = true

export default handler