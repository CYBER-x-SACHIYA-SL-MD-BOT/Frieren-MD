import { remini } from '#lib/remini.js'

export default function(ev) {
    ev.on({
        name: 'remini',
        cmd: ['remini', 'hd', 'upscale', 'hdr'],
        tags: 'Tools Menu',
        desc: 'Memperjernih foto (HD/Upscale)',
        run: async (xp, m, { chat }) => {
            const q = m.quoted ? m.quoted : m
            const mime = (q.msg || q).mimetype || ''
            
            if (!/image/.test(mime)) {
                return m.reply('❌ Kirim/Reply gambar dengan caption .remini')
            }

            await xp.sendMessage(chat.id, { react: { text: '✨', key: m.key } })

            try {
                const img = await q.download()
                const result = await remini(img)

                if (result.success) {
                    if (result.resultBuffer) {
                        await xp.sendMessage(chat.id, { image: result.resultBuffer, caption: '✨ *HD SUCCESS*' }, { quoted: m })
                    } else if (result.resultUrl) {
                        await xp.sendMessage(chat.id, { image: { url: result.resultUrl }, caption: '✨ *HD SUCCESS*' }, { quoted: m })
                    }
                } else {
                    m.reply('❌ Gagal memperjernih gambar. Coba lagi nanti.')
                }
            } catch (e) {
                console.error('Remini Error:', e)
                m.reply('❌ Terjadi kesalahan sistem.')
            }
        }
    })
}
