import fetch from 'node-fetch'
import FormData from 'form-data'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');
import { tmpFiles } from '../../../system/tmpfiles.js'

export default function(ev) {
  // --- WHAT MUSIC (SHAZAM) ---
  ev.on({
    name: 'whatmusic',
    cmd: ['whatmusic', 'whatmusik', 'wmusic', 'shazam'],
    tags: 'Search Menu',
    desc: 'Deteksi judul lagu dari audio',
    run: async (xp, m, { chat }) => {
        try {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
            const mime = (q.audioMessage || q.videoMessage || {}).mimetype || ''
            
            if (!/audio|video/.test(mime)) return m.reply('❌ Reply audio/video dengan caption .whatmusic')

            await xp.sendMessage(chat.id, { react: { text: '🎧', key: m.key } })

            const buffer = await downloadMediaMessage({ message: q }, 'buffer')
            
            // Limit size to avoid timeout/large payload issues (e.g. 5MB)
            if (buffer.length > 5 * 1024 * 1024) return m.reply('Media terlalu besar (Max 5MB). Potong dulu audionya.')

            const form = new FormData()
            form.append('file', buffer, { filename: 'audio.mp3', contentType: 'audio/mpeg' })
            form.append('sample_size', String(buffer.length))

            const res = await fetch('https://api.doreso.com/humming', {
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                    'Origin': 'https://www.aha-music.com',
                    'Referer': 'https://www.aha-music.com/',
                    ...form.getHeaders()
                },
                body: form
            })

            const json = await res.json()

            if (!json?.data?.[0]?.title) return m.reply('❌ Lagu tidak ditemukan.')

            const music = json.data[0]
            const txt = `🎵 *MUSIC DETECTED* 🎵
            
🎤 *Artist:* ${music.artists?.map(a => a.name).join(', ') || 'Unknown'}
🎼 *Title:* ${music.title}
💿 *Album:* ${music.album || '-'}
📅 *Release:* ${music.release_date || '-'}
🆔 *Label:* ${music.label || '-'}`

            m.reply(txt)

        } catch (e) {
            console.error(e)
            m.reply('Gagal mendeteksi lagu.')
        }
    }
  })


}