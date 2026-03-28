/**
 * @module plugins/search/pinterest_video
 * @description Cari & Download Video Pinterest (No Caption Album)
 */

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { sendAlbumMessage } from '#system/function.js'

const execAsync = promisify(exec)
const API_KEY = 'Milik-Bot-OurinMD'

async function convertM3u8ToMp4(m3u8Url, outputPath) {
    const cmd = `ffmpeg -y -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${outputPath}"`
    await execAsync(cmd, { timeout: 120000 })
    return fs.existsSync(outputPath)
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = text?.trim()
    const tiny = (t) => t.split('').map(c=>{
        const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};
        return m[c]||c
    }).join('')

    if (!query) return m.reply(`╭───「 *${tiny('PINTEREST VIDEO')}* 」───\n│\n│ 📌 Cari video aesthetic.\n│ 🎮 Format: ${usedPrefix + command} <query>\n│\n╰────────────────────`)
    
    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/pinterest-v2?q=${encodeURIComponent(query)}&show=5&type=video&apikey=${API_KEY}`, { timeout: 60000 })
        if (!res.data?.status || !res.data?.data?.length) return m.reply(`❌ Tidak ditemukan.`)
        
        const videos = res.data.data.slice(0, 5)
        const tempDir = './temp'
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
        
        const mediaItems = []
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i]
            if (!video.content?.[0]?.url) continue
            try {
                const videoUrl = video.content[0].url
                let videoBuffer
                if (videoUrl.includes('.m3u8')) {
                    const filePath = path.join(tempDir, `pinvid_${Date.now()}_${i}.mp4`)
                    await convertM3u8ToMp4(videoUrl, filePath)
                    if (fs.existsSync(filePath)) {
                        videoBuffer = fs.readFileSync(filePath)
                        fs.unlinkSync(filePath)
                    }
                } else {
                    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer' })
                    videoBuffer = Buffer.from(videoRes.data)
                }
                if (videoBuffer) {
                    mediaItems.push({
                        type: 'video',
                        media: videoBuffer,
                        caption: '' // NO CAPTION
                    })
                }
            } catch (e) { continue }
        }
        
        if (mediaItems.length > 0) {
            await sendAlbumMessage(conn, m.chat, mediaItems, {}, { quoted: m })
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        }
    } catch { m.reply("❌ Sistem error.") }
}

handler.help = ['pinvid']
handler.tags = ['search']
handler.command = ['pinvid', 'pinv']
handler.prefix = true

export default handler
