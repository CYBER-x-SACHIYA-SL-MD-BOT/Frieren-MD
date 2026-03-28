import axios from 'axios'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@adiwajshing/baileys');
import { handleApiError } from '../../../system/function.js';

export default function(ev) {
    ev.on({
        name: 'brave',
        cmd: ['brave', 'bravesearch', 'br'],
        tags: 'Search Menu',
        desc: 'Cari informasi atau gambar menggunakan Brave Search',
        run: async (xp, m, { args, command, usedPrefix }) => {
            const query = args.join(' ')
            if (!query) return m.reply(`⚠️ Masukkan hal yang ingin dicari!\nContoh: .${command} Foto waguri`)

            await xp.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

            try {
                // Fetch API NexRay
                const { data } = await axios.get(`https://api.nexray.web.id/search/brave?q=${encodeURIComponent(query)}`)

                if (!data.status || !data.result || data.result.length === 0) {
                    return m.reply('❌ Tidak ditemukan hasil pencarian di Brave.')
                }

                const results = data.result
                const isImageSearch = /foto|gambar|image|pfp|wallpaper/i.test(query)

                if (isImageSearch) {
                    const cards = []
                    // Filter hasil yang punya image_url valid
                    const imageResults = results.filter(item => item.image_url && item.image_url !== '-')

                    if (imageResults.length === 0) return m.reply('❌ Tidak ditemukan gambar untuk pencarian tersebut.')

                    for (let i = 0; i < Math.min(imageResults.length, 10); i++) {
                        const item = imageResults[i]
                        try {
                            const media = await prepareWAMessageMedia({ image: { url: item.image_url } }, { upload: xp.waUploadToServer })
                            
                            cards.push({
                                body: proto.Message.InteractiveMessage.Body.create({ text: item.title || 'Brave Image' }),
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: "Brave Search" }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: true,
                                    ...media
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "🖼️ LIHAT ASLI",
                                                url: item.image_url,
                                                merchant_url: item.image_url
                                            })
                                        }
                                    ]
                                })
                            })
                        } catch (e) {
                            console.error('Gagal load gambar Brave:', e)
                        }
                    }

                    if (cards.length === 0) return m.reply('❌ Gagal memproses gambar.')

                    const msg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    body: proto.Message.InteractiveMessage.Body.create({ text: `🦁 *BRAVE IMAGE SEARCH*\n🔎 Query: ${query}` }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({ text: global.botName }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        title: "HASIL PENCARIAN GAMBAR",
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

                    return await xp.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
                } else {
                    // Pencarian teks biasa (List)
                    let txt = `🦁 *BRAVE WEB SEARCH*\n🔎 Query: ${query}\n\n`
                    
                    results.slice(0, 10).forEach((item, i) => {
                        txt += `${i + 1}. *${item.title}*\n`
                        if (item.image_url && item.image_url !== '-') {
                            txt += `🔗 Link: ${item.image_url}\n`
                        }
                        txt += `\n`
                    })

                    txt += `_Gunakan kata kunci "Foto" atau "Gambar" untuk melihat hasil visual_`
                    return m.reply(txt)
                }

            } catch (e) {
                console.error('Brave Search Error:', e)
                m.reply(handleApiError(e))
            }
        }
    })
}
