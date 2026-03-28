import axios from 'axios'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@adiwajshing/baileys');
import { handleApiError } from '../../../system/function.js';

export default function(ev) {
    ev.on({
        name: 'soundcloud',
        cmd: ['soundcloud', 'scsearch'],
        tags: 'Search Menu',
        desc: 'Cari lagu di SoundCloud',
        run: async (xp, m, { args, command }) => {
            const query = args.join(' ')
            if (!query) return m.reply(`⚠️ Masukkan judul lagu yang ingin dicari!\nContoh: .${command} Evaluasi`)

            await xp.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

            try {
                // Fetch API NexRay
                const { data } = await axios.get(`https://api.nexray.web.id/search/soundcloud?q=${encodeURIComponent(query)}`)

                if (!data.status || !data.result || data.result.length === 0) {
                    return m.reply('❌ Lagu tidak ditemukan di SoundCloud.')
                }

                const results = data.result
                const cards = []

                // Buat Carousel Cards (Max 10)
                for (let i = 0; i < Math.min(results.length, 10); i++) {
                    const item = results[i]
                    
                    let header = {
                        title: item.title,
                        subtitle: `By ${item.author?.name || 'Unknown'}`,
                        hasMediaAttachment: false
                    }

                    if (item.thumbnail) {
                        try {
                            // Upgrade thumbnail quality if possible (Sndcdn often uses -large.jpg for 100x100)
                            // -t500x500.jpg is usually available
                            const hdThumb = item.thumbnail.replace('-large.jpg', '-t500x500.jpg')
                            const media = await prepareWAMessageMedia({ image: { url: hdThumb } }, { upload: xp.waUploadToServer })
                            header = { ...header, hasMediaAttachment: true, ...media }
                        } catch (e) {
                            console.error('Gagal load gambar SoundCloud:', e)
                        }
                    }

                    const bodyText = `⏱️ *Durasi:* ${item.duration}\n` +
                                   `▶️ *Plays:* ${item.play_count}\n` +
                                   `❤️ *Likes:* ${item.like_count}\n` +
                                   `📅 *Release:* ${item.release_date}`

                    cards.push({
                        body: proto.Message.InteractiveMessage.Body.create({ text: bodyText }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: "SoundCloud Search" }),
                        header: proto.Message.InteractiveMessage.Header.create(header),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "🎧 DENGARKAN",
                                        url: item.url,
                                        merchant_url: item.url
                                    })
                                }
                            ]
                        })
                    })
                }

                // Kirim Carousel
                const msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({ text: `☁️ *SOUNDCLOUD SEARCH*\n🔎 Query: ${query}` }),
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: global.botName }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    title: "HASIL PENCARIAN",
                                    subtitle: "Geser untuk melihat hasil lainnya",
                                    hasMediaAttachment: false
                                }),
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                                    cards: cards
                                })
                            })
                        }
                    }
                }, { quoted: m })

                await xp.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

            } catch (e) {
                console.error('SoundCloud Search Error:', e)
                m.reply(handleApiError(e))
            }
        }
    })
}
