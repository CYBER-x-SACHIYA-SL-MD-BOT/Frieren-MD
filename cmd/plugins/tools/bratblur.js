/**
 * @module plugins/tools/bratblur
 * @description Membuat stiker brat dengan efek blur (Aesthetic)
 * @author Ported for FrierenBot
 */

import axios from 'axios'
import fs from 'fs'
import { writeExifImg } from '#system/exif.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Resolve input (text or quoted text)
    const input = text || (m.quoted && (m.quoted.text || m.quoted.caption))
    
    if (!input) {
        return m.reply(
            `🟩 *𝐁𝐑𝐀𝐓 𝐁𝐋𝐔𝐑 𝐒𝐓𝐈𝐂𝐊𝐄𝐑*\n\n` +
            `Buat stiker brat estetik dengan efek blur!\n\n` +
            `╭┈┈⬡「 📋 *𝐂𝐀𝐑𝐀 𝐏𝐀𝐊𝐀𝐈* 」\n` +
            `┃ ${usedPrefix + command} <teks>\n` +
            `┃ Atau reply pesan teks dengan command.\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*𝐂𝐨𝐧𝐭𝐨𝐡:* \n` +
            `> ${usedPrefix + command} Hidup Jokowi`
        )
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    try {
        // Menggunakan API Zell untuk Brat Blur
        const apiUrl = `https://zellapi.autos/tools/bratblur?q=${encodeURIComponent(input)}`
        
        // 1. Fetch Image Buffer from API
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        // Check if response is potentially an error JSON
        if (response.headers['content-type']?.includes('application/json')) {
            const json = JSON.parse(Buffer.from(response.data).toString())
            if (!json.status) throw new Error(json.message || "API Error")
        }

        const buffer = Buffer.from(response.data)

        // 2. Convert to Sticker with Watermark
        const packname = global.packname || 'FrierenBot'
        const author = global.author || 'Har'
        
        const exifPath = await writeExifImg(buffer, { packname, author })
        
        if (exifPath) {
            await conn.sendMessage(m.chat, { sticker: fs.readFileSync(exifPath) }, { quoted: m })
            fs.unlinkSync(exifPath)
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        } else {
            throw new Error("Gagal mengolah stiker.")
        }

    } catch (error) {
        console.error('[BratBlur] Error:', error.message)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        await m.reply(`❌ *𝐆𝐀𝐆𝐀𝐋*\n\n> ${error.message}`)
    }
}

handler.help = ['bratblur <teks>']
handler.tags = ['tools', 'maker']
handler.command = ['bratblur', 'blurbrat']
handler.limit = true
handler.cooldown = 10
handler.prefix = true

export default handler
