import { createUrl } from '../../../system/apis.js'

export default function(ev) {
    ev.on({
        name: 'iqc',
        cmd: ['iqc', 'iphonequotedchat'],
        tags: 'Maker Menu',
        desc: 'Membuat pesan quote gaya iPhone',
        run: async (xp, m, { args, chat, usedPrefix, command }) => {
            try {
                // Ambil input dari teks argumen atau pesan yang di-reply
                const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                let text = args.join(' ')
                
                if (!text && quoted) {
                    text = quoted.conversation || quoted.extendedTextMessage?.text || ''
                }

                if (!text) {
                    return m.reply(`*Contoh:* ${usedPrefix + command} Halo dunia!`)
                }

                if (text.length > 1000) {
                    return m.reply('❌ Teks terlalu panjang! Maksimal 1000 karakter.')
                }

                await xp.sendMessage(chat.id, { react: { text: '📱', key: m.key } })

                // Menggunakan API ZNX (Zenitsu) sesuai referensi
                const apiUrl = createUrl('znx', '/api/maker/iqc', {
                    text: text
                })

                if (!apiUrl) throw new Error('Gagal membuat URL API.')

                await xp.sendMessage(chat.id, {
                    image: { url: apiUrl },
                    caption: `📱 *iPhone Quoted Chat*`
                }, { quoted: m })

            } catch (e) {
                console.error('IQC Error:', e)
                m.reply('❌ Terjadi kesalahan saat membuat quote iPhone.')
            }
        }
    })
}
