import axios from 'axios'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@adiwajshing/baileys');

export default function(ev) {
    ev.on({
        name: 'applemusic',
        cmd: ['applemusic', 'apple'],
        tags: 'Search Menu',
        desc: 'Cari lagu/artis di Apple Music',
        run: async (xp, m, { args, command }) => {
            const query = args.join(' ')
            if (!query) return m.reply(`⚠️ Masukkan judul lagu atau nama artis!\nContoh: .${command} siinamota`)

            await xp.sendMessage(m.chat, { react: { text: '🎵', key: m.key } })

            try {
                // Fetch API
                const { data } = await axios.get(`https://api.nexray.web.id/search/applemusic?q=${encodeURIComponent(query)}`)

                // Validasi Response
                if (!data.status || !data.result || data.result.length === 0) {
                    return m.reply('❌ Lagu atau artis tidak ditemukan di Apple Music.')
                }

                const results = data.result
                const cards = []

                // Buat Carousel Cards (Max 10)
                for (let i = 0; i < Math.min(results.length, 10); i++) {
                    const item = results[i]
                    
                    // Siapkan gambar (thumbnail)
                    let header = {
                        title: item.title,
                        subtitle: item.subtitle,
                        hasMediaAttachment: false
                    }

                    if (item.image) {
                        try {
                            // High Quality Thumbnail hack (ganti 110x110 jadi 600x600)
                            const hdImage = item.image.replace('110x110', '600x600')
                            const media = await prepareWAMessageMedia({ image: { url: hdImage } }, { upload: xp.waUploadToServer })
                            header = { ...header, hasMediaAttachment: true, ...media }
                        } catch (e) {
                            console.error('Gagal load gambar card:', e)
                        }
                    }

                    cards.push({
                        body: proto.Message.InteractiveMessage.Body.create({ text: item.subtitle || 'Apple Music' }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: "Apple Music Search" }),
                        header: proto.Message.InteractiveMessage.Header.create(header),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "🎧 DENGARKAN",
                                        url: item.link,
                                        merchant_url: item.link
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
                                body: proto.Message.InteractiveMessage.Body.create({ text: `🍎 *APPLE MUSIC SEARCH*\n🔎 Query: ${query}` }),
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: global.botName }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    title: "HASIL PENCARIAN",
                                    subtitle: "Geser untuk melihat lebih banyak",
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
                console.error('AppleMusic Error:', e)
                
                // Error Handling yang dimengerti user
                let errorMsg = '❌ Terjadi kesalahan sistem.'
                
                if (e.response) {
                    if (e.response.status === 404) errorMsg = '❌ Data tidak ditemukan (API 404).'
                    else if (e.response.status >= 500) errorMsg = '❌ Server API sedang gangguan. Coba lagi nanti.'
                } else if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
                    errorMsg = '❌ Koneksi timeout. Server lambat merespon.'
                }

                m.reply(errorMsg)
            }
        }
    })
}
