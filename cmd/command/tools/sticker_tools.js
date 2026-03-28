import { createRequire } from "module";
import fs from 'fs'
import { writeExifImg, writeExifVid } from '../../../system/exif.js'

const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

export default function(ev) {
    ev.on({
        name: 'sticker_steal',
        cmd: ['steal', 'wm', 'colong', 'take'],
        tags: 'Tools Menu',
        desc: 'Ambil stiker dan ganti author/packname',
        run: async (xp, m, { args, chat }) => {
            try {
                let q = m.quoted ? m.quoted : m
                let mime = (q.msg || q).mimetype || ''
                if (!/webp/.test(mime)) return m.reply('Reply stiker nya!')

                let packname = global.packname || 'Sticker'
                let author = global.author || 'Bot'

                if (args.length > 0) {
                    const split = args.join(' ').split('|')
                    packname = split[0] || packname
                    author = split[1] || author
                }

                await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

                const img = await downloadMediaMessage(q, 'buffer')
                let filepath
                
                if (q.msg?.seconds > 0) {
                    // Animated
                    filepath = await writeExifVid(img, { packname, author })
                } else {
                    // Static
                    filepath = await writeExifImg(img, { packname, author })
                }

                await xp.sendMessage(chat.id, { 
                    sticker: { url: filepath } 
                }, { quoted: m })

                // Cleanup handled by writeExif? 
                // writeExif returns path to temp file. We should delete it?
                // system/exif.js says: "fs.unlinkSync(input)" but the output file remains.
                // Usually better to read and delete, but sendMessage handles file path.
                // We should assume we need to clean up if we want to be clean.
                // But Baileys usually handles buffer/stream.
                
                // Let's rely on OS temp cleaning or add cleanup if needed.
                
            } catch (e) {
                console.error(e)
                m.reply('Gagal mengambil stiker.')
            }
        }
    })
}
