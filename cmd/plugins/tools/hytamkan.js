/**
 * @module plugins/tools/hytamkan
 * @description Waifu Hitam Maker (Filter Selector)
 */

import axios from 'axios'
import { uploader } from '#system/lib/uploader.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

const FILTERS = ['Coklat', 'Hitam', 'Nerd', 'Piggy', 'Carbon', 'Botak']
global.waifuhitamCache = global.waifuhitamCache || {}

async function Hytamkan(imageUrl, filter = 'Hitam') {
  const selected = FILTERS.find(f => f.toLowerCase() === filter.toLowerCase())
  if (!selected) throw new Error(`Filter '${filter}' tidak tersedia.`) 

  const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' })
  const base64Input = Buffer.from(imgRes.data).toString('base64')

  const res = await axios.post('https://wpw.my.id/api/process-image', {
    imageData: base64Input,
    filter: selected.toLowerCase()
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://wpw.my.id',
      'Referer': 'https://wpw.my.id/',
    }
  })

  const dataUrl = res.data?.processedImageUrl
  if (!dataUrl?.startsWith('data:image/')) throw new Error('Gagal memproses gambar.')

  return Buffer.from(dataUrl.split(',')[1], 'base64')
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const tiny = (t) => t.split('').map(c=>{
        const m = {
            'a':'ᴀ',
            'b':'ʙ',
            'c':'ᴄ',
            'd':'ᴅ',
            'e':'ᴇ',
            'f':'ꜰ',
            'g':'ɢ',
            'h':'ʜ',
            'i':'ɪ',
            'j':'ᴊ',
            'k':'ᴋ',
            'l':'ʟ',
            'm':'ᴍ',
            'n':'ɴ',
            'o':'ᴏ',
            'p':'ᴘ',
            'q':'ǫ',
            'r':'ʀ',
            's':'s',
            't':'ᴛ',
            'u':'ᴜ',
            'v':'ᴠ',
            'w':'ᴡ',
            'x':'x',
            'y':'ʏ',
            'z':'ᴢ'
        };
        return m[c] || c
    }).join('')
    const sender = m.sender

    // --- MODE 1: UPLOAD & SELECT ---
    if (command === 'hytamkan') {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''

        if (!/image\/(jpe?g|png|gif)/.test(mime)) {
            return m.reply(`╭───「 *${tiny('HYTAMKAN')}* 」───\n│\n│ 📸 Reply gambar untuk memulai.\n│\n╰────────────────────`)
        }

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

        try {
            // Reconstruct download object
            const msgToDownload = {
                key: q.key,
                message: q.message || { [q.mtype]: q.msg }
            }
            const media = await downloadMediaMessage(msgToDownload, 'buffer')
            const imageUrl = await uploader(media)
            
            if (!imageUrl) return m.reply("❌ Gagal upload gambar.")
            
            global.waifuhitamCache[sender] = imageUrl

            let txt = `╭───「 *${tiny('SELECT FILTER')}* 」───\n`
            txt += `│\n`
            FILTERS.forEach(f => {
                txt += `│ 🧪 ${usedPrefix}waifufilter ${f}\n`
            })
            txt += `│\n`
            txt += `╰────────────────────\n`
            txt += `> Pilih filter di atas.`

            await m.reply(txt)
            await conn.sendMessage(m.chat, { react: { text: '🎨', key: m.key } })

        } catch (e) {
            m.reply(`❌ Error: ${e.message}`)
        }
        return
    }

    // --- MODE 2: APPLY FILTER ---
    if (command === 'waifufilter') {
        const filter = args[0]?.toLowerCase()
        if (!filter) return m.reply("❌ Pilih filter dulu.")
        
        const imageUrl = global.waifuhitamCache[sender]
        if (!imageUrl) return m.reply(`❌ Session habis. Kirim gambar lagi dengan ${usedPrefix}hytamkan`)

        await conn.sendMessage(m.chat, { react: { text: '🖤', key: m.key } })

        try {
            const result = await Hytamkan(imageUrl, filter)
            delete global.waifuhitamCache[sender] // Clear cache

            await conn.sendMessage(m.chat, {
                image: result,
                caption: `╭───「 *${tiny('RESULT')}* 」───\n│\n│ 🧪 Filter: ${filter.toUpperCase()}\n│\n╰────────────────────`
            }, { quoted: m })
            
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

        } catch (e) {
            console.error(e)
            m.reply(`❌ Gagal memproses: ${e.message}`)
        }
    }
}

handler.help = ['irengkan']
handler.tags = ['tools', 'anime']
handler.command = ['irengkan', 'waifufilter']
handler.limit = true
handler.prefix = true

export default handler
