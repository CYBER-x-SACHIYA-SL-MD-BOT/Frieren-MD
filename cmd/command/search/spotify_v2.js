import axios from 'axios'
import { sendIAMessage } from '../../../system/function.js'

export default function(ev) {
    ev.on({
        name: 'spotifyv2',
        cmd: ['spotify2', 'spotifyv2'],
        tags: 'Search Menu',
        desc: 'Cari lagu di Spotify (V2)',
        run: async (xp, m, { args, text, usedPrefix, command }) => {
            if (!text) return m.reply(`*Contoh:* ${usedPrefix + command} dj khalid`)

            await xp.sendMessage(m.chat, { react: { text: '🎵', key: m.key } })

            try {
                const { data } = await axios.get(`https://www.restwave.my.id/search/spotify?query=${encodeURIComponent(text)}`)

                if (!data.status || !data.result || data.result.length === 0) {
                    return m.reply('❌ Lagu tidak ditemukan.')
                }

                const song = data.result[0] // Ambil hasil pertama
                const buttons = [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "🎧 Listen on Spotify",
                            url: song.link,
                            merchant_url: song.link
                        })
                    }
                ]

                const caption = `🎵 *SPOTIFY SEARCH V2*

📌 *Judul:* ${song.title}
🎤 *Artis:* ${song.artist}
⏱️ *Durasi:* ${(song.duration_ms / 1000 / 60).toFixed(2)} menit
🔥 *Popularitas:* ${song.popularity}
🔗 *Link:* ${song.link}`

                await sendIAMessage(xp, m.chat, buttons, {
                    media: song.image,
                    mediaType: 'image',
                    body: caption,
                    footer: global.botName
                }, { quoted: m })

            } catch (e) {
                console.error('SpotifyV2 Error:', e)
                m.reply('❌ Terjadi kesalahan saat mencari lagu.')
            }
        }
    })
}
