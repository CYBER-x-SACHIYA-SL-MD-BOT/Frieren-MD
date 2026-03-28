import axios from 'axios'
import fs from 'fs'
import { writeExifImg } from '#system/exif.js'
import { call } from '#system/function.js'

export default function quotly(ev) {
    ev.on({
        name: 'quotly',
        cmd: ['qc', 'quotly', 'faketext'],
        tags: 'Maker Menu',
        desc: 'Membuat stiker fake chat',
        owner: !1,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            try {
                let text = args.join(' ')
                let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                
                if (!text && quoted) {
                    text = quoted.conversation || quoted.extendedTextMessage?.text || ''
                }

                if (!text) return xp.sendMessage(chat.id, { text: 'Masukkan teks atau reply chat untuk dijadikan quote!' }, { quoted: m })
                if (text.length > 500) return m.reply('Teks kepanjangan (Max 500 karakter).')

                await xp.sendMessage(chat.id, { react: { text: '💬', key: m.key } })

                let target = m.sender
                let name = m.pushName
                
                if (m.message?.extendedTextMessage?.contextInfo?.participant) {
                    target = m.message.extendedTextMessage.contextInfo.participant
                }

                let pp
                try { 
                    pp = await xp.profilePictureUrl(target, 'image') 
                } catch { 
                    pp = 'https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg' 
                }

                const url = `https://zellapi.autos/tools/qc?text=${encodeURIComponent(text)}&name=${encodeURIComponent(name)}&pp=${encodeURIComponent(pp)}`

                const res = await fetch(url)
                if (!res.ok) throw new Error(`API Error: ${res.statusText}`)
                
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);


                const sticker = await writeExifImg(buffer, {
                    packname: global.botName,
                    author: global.ownerName
                })

                await xp.sendMessage(chat.id, { sticker: fs.readFileSync(sticker) }, { quoted: m })
                fs.unlinkSync(sticker)

            } catch (e) {
                console.error(e)
                m.reply('Gagal membuat quotly.')
            }
        }
    })
}