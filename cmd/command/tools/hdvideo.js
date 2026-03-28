import axios from 'axios'
import FormData from 'form-data'

export default function(ev) {
    ev.on({
        name: 'hdvideo',
        cmd: ['hdvideo', 'hdvid'],
        tags: 'Tools',
        desc: 'Memperjernih kualitas video (HD)',
        limit: true,
        run: async (xp, m, { usedPrefix, command }) => {
            const contoh = `Reply video lalu ketik\n${usedPrefix + command}`
            let q = m.quoted ? m.quoted : null

            if (!q || !/video/.test(q.mimetype || m.mimetype)) {
                return m.reply(`❌ Reply videonya!\n\n${contoh}`)
            }

            // Helper Upload Telegra.ph (Internal scope)
            async function uploadTelegraph(buffer) {
                const form = new FormData()
                form.append('file', buffer, { filename: 'video.mp4', contentType: 'video/mp4' })
                try {
                    const { data } = await axios.post('https://telegra.ph/upload', form, {
                        headers: { ...form.getHeaders() }
                    })
                    if (!data?.[0]?.src) throw new Error('Respon upload tidak valid')
                    return 'https://telegra.ph' + data[0].src
                } catch (e) {
                    throw new Error('Gagal upload ke Telegra.ph')
                }
            }

            try {
                await xp.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
                
                // Download Media
                let media = await q.download()
                if (!media) throw new Error('Gagal mendownload media')

                // Upload ke Telegra.ph
                let url = await uploadTelegraph(media)

                // Call API HD Video
                let res = await axios.get(`https://api-faa.my.id/faa/hdvid?url=${encodeURIComponent(url)}`)
                let json = res.data

                if (!json.status || !json.result?.download_url) {
                    throw new Error(json.message || 'Gagal memproses video (API Error).')
                }

                await xp.sendMessage(m.chat, {
                    video: { url: json.result.download_url },
                    caption: '🎥 *Video HD berhasil diproses!*'
                }, { quoted: m })
                
                await xp.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

            } catch (e) {
                console.error('HDVideo Error:', e)
                await xp.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
                m.reply(`❌ Terjadi kesalahan: ${e.message}`)
            }
        }
    })
}
