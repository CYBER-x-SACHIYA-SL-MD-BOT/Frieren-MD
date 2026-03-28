/**
 * @module plugins/tools/nsfw_check
 * @description Check Image for NSFW content via Denay API
 */

import axios from 'axios'
import { uploader } from '#system/lib/uploader.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    let url = text

    if (!url && !mime) return m.reply(`❌ Kirim/Reply gambar atau masukkan URL gambar.
Contoh: *${usedPrefix + command}* https://example.com/image.jpg`)

    await m.reply('🔍 _Checking NSFW Content..._')

    try {
        if (!url && mime) {
            const msgToDownload = {
                key: q.key,
                message: q.message || { [q.mtype]: q.msg }
            };
            let media = await downloadMediaMessage(msgToDownload, 'buffer')
            url = await uploader(media)
            if (!url) throw new Error('Gagal upload media.')
        }

        const { data } = await axios.get(`https://api.denayrestapi.xyz/api/v1/tools/nsfwchecker?imageUrl=${encodeURIComponent(url)}`)

        if (data.status !== 200 || !data.result) return m.reply('❌ Gagal memeriksa gambar.')

        const r = data.result
        const isSafe = r.labelName === "Not Porn"
        const icon = isSafe ? '✅' : '🔞'
        const color = isSafe ? 'Safe' : 'NSFW DETECTED'

        let txt = `${icon} *NSFW CHECKER*

`
        txt += `🏷️ *Label:* ${r.labelName}
`
        txt += `📊 *Confidence:* ${(r.confidence * 100).toFixed(2)}%
`
        txt += `🖼️ *Status:* ${color}
`
        txt += `🔗 *Source:* ${r.source}`

        await m.reply(txt)

    } catch (e) {
        console.error('NSFW Check Error:', e)
        m.reply('❌ Terjadi kesalahan saat memeriksa gambar.')
    }
}

handler.help = ['nsfwcheck', 'checknsfw']
handler.tags = ['tools']
handler.command = ['nsfwcheck', 'checknsfw', 'isporn']
handler.prefix = true

export default handler