import axios from 'axios'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');
import { tmpFiles } from '#system/tmpfiles.js'

export default function ocr(ev) {
    ev.on({
        name: 'ocr',
        cmd: ['ocr', 'img2text', 'readtext'],
        tags: 'Tools Menu',
        desc: 'Ambil teks dari gambar (OCR)',
        owner: !1,
        prefix: !0,
        run: async (xp, m, { chat }) => {
            try {
                const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                const image = quoted?.imageMessage || m.message?.imageMessage

                if (!image) return m.reply('❌ Kirim/Reply gambar dengan caption .ocr')

                await xp.sendMessage(chat.id, { react: { text: '🔍', key: m.key } })

                // 1. Download Media
                const buffer = await downloadMediaMessage({ message: quoted || m.message }, 'buffer')
                
                // 2. Upload to TmpFiles (untuk dapat URL)
                const imgUrl = await tmpFiles(buffer)
                if (!imgUrl) return m.reply('Gagal upload gambar.')

                // 3. Call API Zenitsu
                const url = `https://api.zenitsu.web.id/api/tools/ocr?imgUrl=${encodeURIComponent(imgUrl)}`
                const res = await axios.get(url)

                if (!res.data || !res.data.results) throw new Error('API Error')

                const text = res.data.results
                m.reply(`📝 *HASIL OCR*\n\n${text}`)

            } catch (e) {
                console.error(e)
                m.reply('Gagal membaca teks dari gambar.')
            }
        }
    })
}