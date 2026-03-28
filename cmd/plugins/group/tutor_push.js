/**
 * @module plugins/group/tutor_push
 * @description Tutorial Push Kontak
 */

import fs from 'fs'

let handler = async (m, { conn }) => {
    // Fake Contact for Quoted
    const fkontak = {
        key: { 
            participant: '0@s.whatsapp.net', 
            remoteJid: 'status@broadcast', 
            fromMe: false, 
            id: 'Halo' 
        },
        message: {
            locationMessage: { 
                name: `${global.botName || 'FrierenBot'}`, 
                jpegThumbnail: null 
            }
        }
    }

    let str = `
*Panduan Fitur Pushkontak*

• *.listgc*
Melihat semua list group join dan melihat informasi group beserta semua ID group.

• *.svkontakv2 <idgroup>*
Otomatis menyimpan nomor WhatsApp member di group yg ditentukan menggunakan ID group.

• *.pushidgc <idgroup>|<pesan>*
Otomatis mengirimkan pesan ke group dengan ID group yg ditentukan (delay aman).

• *.pushdelay <pesan>|<jeda>*
Otomatis mengirimkan pesan ke semua member group saat ini dengan delay.

• *.pushkontak <pesan>*
Otomatis mengirimkan pesan ke semua member di group saat ini (Cepat/Spam).

• *.svkontak*
Simpan kontak member di group saat ini.

• *.cekid*
Mengetahui ID group saat ini.
      
© ${global.botName || 'FrierenBot'}`.trim()

    await conn.sendMessage(m.chat, {
        text: str, 
        contextInfo: {
            externalAdReply: {
                mediaUrl: '', 
                mediaType: 1,
                title: '📢 PUSH KONTAK SYSTEM',
                body: 'Broadcast & Promotion Tool', 
                thumbnailUrl: global.thumbmenu || global.thumbnail || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg', 
                sourceUrl: global.sgc || 'https://chat.whatsapp.com/...',
                renderLargerThumbnail: true, 
                showAdAttribution: true
            }
        }
    }, { quoted: fkontak })
}

handler.help = ['tutorpush']
handler.tags = ['pushkontak', 'owner']
handler.command = ['tutorpush', 'helppush']
handler.owner = true // Usually push tools are owner only
handler.prefix = true

export default handler