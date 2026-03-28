import { createRequire } from "module";
import axios from 'axios';
import { db, saveDb } from '../../../system/db/data.js'

const require = createRequire(import.meta.url);

export default function(ev) {
    
    // --- 1. FAKE LINK PREVIEW ---
    ev.on({
        name: 'fakelink',
        cmd: ['fakelink', 'trap'],
        tags: 'Tools',
        desc: 'Kirim link dengan preview palsu. Format: link_asli | judul | deskripsi | link_palsu | gambar_url(opsional)',
        run: async (xp, m, { args }) => {
            const text = args.join(' ')
            if (!text.includes('|')) return m.reply(`❌ Format Salah!\nGunakan: .fakelink link_asli | judul | deskripsi | link_palsu | gambar_url\n\nContoh:\n.fakelink https://youtube.com/watch?v=dQw4w9WgXcQ | File Skripsi.pdf | Google Drive | drive.google.com | https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png`)

            const parts = text.split('|').map(s => s.trim())
            const realUrl = parts[0]
            const title = parts[1] || 'Link Penting'
            const body = parts[2] || 'Klik untuk membuka'
            const fakeUrl = parts[3] || realUrl
            const thumbUrl = parts[4] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_"G"_Logo.svg/1200px-Google_"G"_Logo.svg.png'

            try {
                let thumbBuffer = null
                try {
                    // Force arraybuffer for binary data
                    const res = await axios.get(thumbUrl, { responseType: 'arraybuffer' })
                    thumbBuffer = res.data
                } catch (e) {
                    console.error('Gagal download thumbnail fakelink:', e.message)
                    // Jika gagal, biarkan null atau gunakan buffer kosong
                }

                // Kirim pesan dengan contextInfo yang dimanipulasi
                await xp.sendMessage(m.chat, {
                    text: `*${title}*\n${body}`, // Text utama
                    contextInfo: {
                        externalAdReply: {
                            title: title,
                            body: `🔗 ${fakeUrl}`, // Tampilkan URL palsu di sini
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnail: thumbBuffer, // Buffer wajib ada agar gambar muncul
                            sourceUrl: realUrl, // Link asli yang dibuka saat diklik
                            showAdAttribution: false // Opsional
                        }
                    }
                }, { quoted: m })

            } catch (e) {
                console.error('Error fakelink:', e)
                m.reply('Gagal mengirim fake link.')
            }
        }
    })

    // --- 2. INVISIBLE TEXT / READ MORE (PESAN HANTU) ---
    ev.on({
        name: 'blank',
        cmd: ['blank', 'hantu', 'empty', 'readmore'],
        tags: 'Tools',
        desc: 'Buat pesan kosong atau Read More palsu',
        run: async (xp, m, { args }) => {
            const input = args.join(' ')
            
            // Karakter ajaib untuk Read More (Kombinasi ZWSP dan RTL mark)
            // Mengulang 4000 kali sudah cukup untuk memicu "Read More" di hampir semua HP
            const readMore = String.fromCharCode(8206).repeat(4001)

            if (!input) {
                // Jika kosong, kirim pesan hantu full (tanpa teks)
                await xp.sendMessage(m.chat, { text: `\u200E${readMore}\u200E` }, { quoted: m })
            } else if (input.includes('|')) {
                // Jika ada pemisah |, buat teks atas dan teks bawah (rahasia)
                const [top, bottom] = input.split('|')
                await xp.sendMessage(m.chat, { text: `${top}${readMore}${bottom}` }, { quoted: m })
            } else {
                // Jika cuma teks biasa, taruh di bawah read more (Prank "Baca Selengkapnya")
                await xp.sendMessage(m.chat, { text: `Baca Selengkapnya...${readMore}${input}` }, { quoted: m })
            }
        }
    })

    // --- 3. FAKE QUOTE (REPLY PALSU) ---
    ev.on({
        name: 'fakequote',
        cmd: ['fakequote', 'fq', 'fakereply'],
        tags: 'Tools',
        desc: 'Buat pesan dengan reply/quote palsu. Format: Teks Balasan | @tag/Nomor | Teks Target',
        run: async (xp, m, { args }) => {
            const input = args.join(' ')
            if (!input.includes('|')) return m.reply(`❌ Format Salah!\nGunakan: .fq Teks Balasan | @tag/Nomor | Teks Target Palsu\n\nContoh:\n.fq Siap laksanakan! | @62812345678 | Tolong kirim pulsa sekarang`)

            const parts = input.split('|').map(s => s.trim())
            const replyText = parts[0]
            const target = parts[1]
            const fakeText = parts[2] || '...' // Default jika tidak ada teks target

            let targetJid = m.sender 
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
            } else if (target && target.match(/\d+/)) {
                targetJid = target.replace(/\D/g, '') + '@s.whatsapp.net'
            }

            const fakeQuote = {
                key: { 
                    remoteJid: m.chat, 
                    fromMe: false, 
                    id: 'FAKE' + Date.now(), 
                    participant: targetJid 
                },
                message: { 
                    conversation: fakeText 
                }
            }

            await xp.sendMessage(m.chat, { 
                text: replyText,
                mentions: [targetJid]
            }, { 
                quoted: fakeQuote 
            })
        }
    })

    // --- 4. AUDIO DURATION SPOOFING (VN PRANK) ---
    ev.on({
        name: 'fakeduration',
        cmd: ['fakeduration', 'vnprank', 'fakevn'],
        tags: 'Tools',
        desc: 'Kirim VN "HIDUP JOKOWI" dengan durasi palsu (99999 detik)',
        run: async (xp, m, { args }) => {
            try {
                // Audio: TTS "HIDUP JOKOWII"
                const text = "HIDUP JOKOWII!"
                const lang = "id"
                const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
                
                await xp.sendMessage(m.chat, {
                    audio: { url: ttsUrl }, 
                    mimetype: 'audio/mp4',
                    ptt: true, // Kirim sebagai VN
                    seconds: 9999999, // Manipulasi Durasi (Seconds)
                    contextInfo: {
                        externalAdReply: {
                            title: "🔈 PESAN PENTING",
                            body: "Dengarkan sampai habis...",
                            mediaType: 1,
                            thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Joko_Widodo_2019_official_portrait.jpg/800px-Joko_Widodo_2019_official_portrait.jpg",
                            sourceUrl: "https://www.presidenri.go.id"
                        }
                    }
                }, { quoted: m })

            } catch (e) {
                console.error('Error fakeduration:', e)
                m.reply('Gagal mengirim VN Prank.')
            }
        }
    })

    // --- 5. CLONE BOT (MENIRU ORANG) ---
    ev.on({
        name: 'clone',
        cmd: ['clone', 'jadi', 'tiru'],
        tags: 'Tools',
        desc: 'Meniru Nama dan Foto Profil orang lain (Impersonate)',
        run: async (xp, m, { args }) => {
            try {
                let targetJid
                if (m.quoted) targetJid = m.quoted.sender
                else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
                else if (args.length > 0) targetJid = args[0].replace(/\D/g, '') + '@s.whatsapp.net'
                else return m.reply('❌ Reply atau Tag target yang mau ditiru!')

                m.reply('🎭 Sedang menyamar...')

                // 1. Simpan Identitas Asli ke DB (Persisten)
                db().settings = db().settings || {}
                
                // Hanya simpan jika BELUM ada backup (agar tidak menimpa backup asli dengan wajah clone)
                if (!db().settings.originalIdentity) {
                    const botJid = xp.user.id.split(':')[0] + '@s.whatsapp.net'
                    let originalPP = null
                    try {
                        originalPP = await xp.profilePictureUrl(botJid, 'image')
                    } catch { 
                        originalPP = global.imageSetting?.default_pp || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'
                    }
                    
                    db().settings.originalIdentity = {
                        name: xp.user.name || global.botName || 'Bot',
                        ppUrl: originalPP
                    }
                    saveDb()
                }

                // 2. Ambil Identitas Target
                let targetName = 'Unknown'
                // Nama bot (pushname) sulit diubah lewat library, tapi kita ubah PP
                
                let targetPPBuffer
                try {
                    const ppUrl = await xp.profilePictureUrl(targetJid, 'image')
                    const fetch = (await import('node-fetch')).default
                    const res = await fetch(ppUrl)
                    if (res.ok) targetPPBuffer = Buffer.from(await res.arrayBuffer())
                } catch (e) {
                    return m.reply('❌ Gagal mengambil foto profil target (Mungkin privasi).')
                }

                // 3. Eksekusi Perubahan
                if (targetPPBuffer) {
                    const botJid = xp.user.id.split(':')[0] + '@s.whatsapp.net'
                    await xp.updateProfilePicture(botJid, targetPPBuffer)
                }

                await xp.sendMessage(m.chat, { text: `✅ Berhasil menyamar menjadi target! (PP Only)\n\nKetik .unclone untuk kembali.` }, { quoted: m })

            } catch (e) {
                console.error('Error clone:', e)
                m.reply('Gagal melakukan cloning.')
            }
        }
    })

    // --- 6. UNCLONE (RESET IDENTITAS) ---
    ev.on({
        name: 'unclone',
        cmd: ['unclone', 'resetme'],
        tags: 'Tools',
        desc: 'Kembalikan profil bot ke semula',
        run: async (xp, m) => {
            m.reply('🔄 Mengembalikan identitas asli...')

            try {
                const botJid = xp.user.id.split(':')[0] + '@s.whatsapp.net'
                const backup = db().settings?.originalIdentity
                
                // Fallback URL jika backup hilang
                const defaultPP = global.imageSetting?.default_pp || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'
                const ppUrl = backup?.ppUrl || defaultPP

                if (ppUrl) {
                     const fetch = (await import('node-fetch')).default
                     const res = await fetch(ppUrl)
                     if (res.ok) {
                         const buffer = Buffer.from(await res.arrayBuffer())
                         await xp.updateProfilePicture(botJid, buffer)
                     } else {
                         throw new Error('Gagal download PP asli')
                     }
                }

                // Clear backup
                delete db().settings.originalIdentity
                saveDb()
                
                m.reply('✅ Identitas bot telah dipulihkan.')

            } catch (e) {
                console.error('Error unclone:', e)
                m.reply('Gagal mengembalikan profil (Gunakan .setppbot manual).')
            }
        }
    })
}