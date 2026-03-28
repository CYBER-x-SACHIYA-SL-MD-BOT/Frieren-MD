/**
 * @module plugins/search/whatanime
 * @description Identifikasi Anime dari Gambar (Screenshot) via Trace.moe
 * @author Ported for FrierenBot
 */

import axios from 'axios'
import FormData from 'form-data'
import { uploader } from '#system/lib/uploader.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

const NEOXR_APIKEY = 'Milik-Bot-OurinMD'

let handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!mime.includes('image')) {
        return m.reply(
            `🔍 *𝐀𝐍𝐈𝐌𝐄 𝐒𝐄𝐀𝐑𝐂𝐇*\n\n` +
            `Kirim/Reply gambar screenshot anime untuk mencari judulnya.\n\n` +
            `> Gunakan caption: 
${usedPrefix + command}
`)
    }

    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })
    await m.reply(`⏳ *𝐒𝐄𝐀𝐑𝐂𝐇𝐈𝐍𝐆...*\n\n> Mengupload & Menganalisis gambar...`)

    try {
        // 1. Download Media
        const msgToDownload = {
            key: q.key,
            message: q.message || { [q.mtype]: q.msg }
        };
        const buffer = await downloadMediaMessage(msgToDownload, 'buffer')
        
        // 2. Upload (Using FrierenBot Uploader)
        const imageUrl = await uploader(buffer)
        if (!imageUrl) throw new Error("Gagal mengupload gambar.")

        // 3. Call API (Neoxr WhatAnime)
        const res = await axios.get(`https://api.neoxr.eu/api/whatanime?url=${encodeURIComponent(imageUrl)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return m.reply(`❌ Anime tidak ditemukan. Pastikan screenshot jelas (bukan fanart/crop).`)
        }
        
        const d = res.data.data
        const similarity = ((d.similarity || 0) * 100).toFixed(2)
        
        // Helper: Format Time
        const formatTime = (seconds) => {
            if (!seconds) return '00:00'
            const mins = Math.floor(seconds / 60)
            const secs = Math.floor(seconds % 60)
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        
        const filename = d.filename || 'Unknown'
        const animeName = filename.replace(/[[.*?]/g, '').replace(/[(.*?)]/g, '').replace(/.mp4|.mkv|.avi/gi, '').trim() || 'Unknown Anime'
        
        const caption = `🔍 *𝐖𝐇𝐀𝐓 𝐀𝐍𝐈𝐌𝐄 𝐈𝐒 𝐓𝐇𝐈𝐒?*\n\n` +
            `🎬 *Judul:* ${animeName}\n` +
            `📺 *Episode:* ${d.episode || 'Movie/OVA'}\n` +
            `🆔 *AniList:* ${d.anilist || '-'}\n\n` +
            `⏱️ *Timestamp:*
` +
            `  ◦ Start: 
${formatTime(d.from)}
` +
            `  ◦ End: 
${formatTime(d.to)}

` +
            `📊 *Akurasi:* ${similarity}%\n\n` +
            `🔗 https://anilist.co/anime/${d.anilist || ''}`
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        
        // Send Image Result
        if (d.image) {
            await conn.sendMessage(m.chat, {
                image: { url: d.image },
                caption: caption
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }
        
        // Send Video Preview
        if (d.video) {
            await conn.sendMessage(m.chat, {
                video: { url: d.video },
                caption: `🎬 *Preview Scene*`,
                mimetype: 'video/mp4'
            }, { quoted: m })
        }

    } catch (error) {
        console.error('[WhatAnime] Error:', error.message)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        m.reply(`❌ *𝐄𝐑𝐑𝐎𝐑*\n\n> ${error.message}`)
    }
}

handler.help = ['animeapaini', 'whatanime']
handler.tags = ['search', 'anime']
handler.command = ['animeapaini', 'whatanime', 'animesearch', 'sauceanime', 'wait']
handler.limit = true
handler.cooldown = 15
handler.prefix = true

export default handler
