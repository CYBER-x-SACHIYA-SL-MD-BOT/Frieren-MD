import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

export default function(ev) {
    ev.on({
        name: 'rvo',
        cmd: ['rvo', 'readviewonce', 'openvo'],
        tags: 'Tools',
        desc: 'Membuka pesan ViewOnce (Sekali Lihat)',
        run: async (xp, m, { args }) => {
            try {
                // Cek quoted msg (cara akses lebih robust)
                if (!m.quoted) return m.reply('❌ Reply pesan ViewOnce yang ingin dibuka!')
                
                let msg = m.quoted.msg || m.quoted
                
                // Deteksi ViewOnce V1 & V2
                // Biasanya ditandai dengan property `viewOnce: true` pada message object
                // Atau structur: viewOnceMessage: { message: { imageMessage: ... } }
                
                const isViewOnce = msg.viewOnce || 
                                   (m.quoted.message?.viewOnceMessage) || 
                                   (m.quoted.message?.viewOnceMessageV2)
                
                if (!isViewOnce) return m.reply('❌ Pesan yang direply bukan ViewOnce!')
                
                m.reply('⏳ Sedang membuka media ViewOnce...')
                
                // Siapkan message object untuk download
                // Jika msg punya viewOnce: true (V2 standard), kita perlu wrap atau pass as is tergantung library
                // Baileys downloadMediaMessage usually expects the FULL message object key like { imageMessage: ... }
                
                let mediaMsg = msg
                if (msg.viewOnce) {
                    // Jika property viewOnce ada di dalam msg (misal imageMessage), itu V2 biasa
                    // Kita perlu pastikan strukturnya benar untuk downloader
                    // Struktur msg biasanya: { url: ..., mimetype: ..., viewOnce: true }
                    // Kita harus bungkus ulang atau biarkan downloader handle
                }
                
                // Download
                const buffer = await m.quoted.download()
                
                // Dapatkan tipe dan caption
                const type = m.quoted.mtype
                const caption = (msg.caption || '') + '\n\n🔓 *Opened by Bot*'
                
                if (/image/.test(type)) {
                     await xp.sendMessage(m.chat, { image: buffer, caption }, { quoted: m })
                } else if (/video/.test(type)) {
                     await xp.sendMessage(m.chat, { video: buffer, caption }, { quoted: m })
                } else if (/audio/.test(type)) {
                     await xp.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
                } else {
                     m.reply('❌ Tipe media tidak dikenali sebagai image/video/audio.')
                }

            } catch (e) {
                console.error('Error rvo:', e)
                m.reply('❌ Gagal membuka ViewOnce. (Error: ' + e.message + ')')
            }
        }
    })
}
