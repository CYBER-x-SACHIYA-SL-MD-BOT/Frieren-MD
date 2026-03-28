import axios from 'axios'
import { sendIAMessage, sendCarouselMessage, handleApiError } from '../../../system/function.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia } = require('@adiwajshing/baileys');

export default function(ev) {
    ev.on({
        name: 'googleimage',
        cmd: ['gimage', 'googleimage', 'image'],
        tags: 'Search Menu',
        desc: 'Cari gambar di Google (Carousel)',
        run: async (xp, m, { args, command, usedPrefix }) => {
            const text = args.join(' ')
            if (!text) return m.reply(`*Contoh:* ${usedPrefix + command} kucing lucu`)

            await xp.sendMessage(m.chat, { react: { text: '🔎', key: m.key } })

            try {
                // API 1: RestWave (Primary)
                let res = await axios.get(`https://www.restwave.my.id/search/gimage?q=${encodeURIComponent(text)}`).catch(() => null)
                let images = res?.data?.result ? res.data.result : null
                
                if (!images || images.length === 0) {
                    throw new Error('All APIs failed')
                }

                // Ambil 5 gambar pertama untuk carousel
                const selectedImages = images.slice(0, 5);
                const cards = [];

                for (const imgData of selectedImages) {
                    try {
                        const imgUrl = imgData.url || imgData; // Handle format object/string
                        const media = await prepareWAMessageMedia({ image: { url: imgUrl } }, { upload: xp.waUploadToServer });
                        
                        cards.push({
                            body: { text: `Query: ${text}` },
                            footer: { text: "Google Image" },
                            header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                            nativeFlowMessage: { 
                                buttons: [{ 
                                    name: "cta_url", 
                                    buttonParamsJson: JSON.stringify({ 
                                        display_text: "🖼️ View Image", 
                                        url: imgUrl, 
                                        merchant_url: imgUrl 
                                    }) 
                                }] 
                            }
                        });
                    } catch (err) {
                        console.error('Error preparing card:', err);
                    }
                }

                if (cards.length > 0) {
                    await sendCarouselMessage(xp, m.chat, cards, {
                        title: "📷 *GOOGLE IMAGE*",
                        body: `🔎 Query: ${text}`,
                        footer: global.botName
                    }, { quoted: m });
                } else {
                    m.reply('❌ Gagal memuat gambar.');
                }

            } catch (e) {
                console.error('Gimage Error:', e)
                
                // Fallback ke API Deline jika Bagus gagal
                try {
                    console.log('Trying fallback API...')
                    const { data } = await axios.get(`https://api.deline.web.id/api/search/pinterest?q=${encodeURIComponent(text)}`)
                    if (data.result && data.result.length > 0) {
                         // Carousel Fallback
                         const fallbackImages = data.result.slice(0, 5);
                         const cards = [];
                         
                         for (const imgData of fallbackImages) {
                            try {
                                const imgUrl = imgData.images_url || imgData;
                                const media = await prepareWAMessageMedia({ image: { url: imgUrl } }, { upload: xp.waUploadToServer });
                                cards.push({
                                    body: { text: `Fallback: ${text}` },
                                    footer: { text: "Pinterest (Fallback)" },
                                    header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                                    nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "View", url: imgUrl, merchant_url: imgUrl }) }] }
                                });
                            } catch {}
                         }

                         if (cards.length > 0) {
                            await sendCarouselMessage(xp, m.chat, cards, {
                                title: "📷 *IMAGE SEARCH (Fallback)*",
                                body: `🔎 Query: ${text}`,
                                footer: global.botName
                            }, { quoted: m });
                            return;
                         }
                    }
                } catch (err2) {
                    console.error('Fallback Error:', err2)
                }

                m.reply(handleApiError(e))
            }
        }
    })

    // --- BING IMAGE ---
    ev.on({
        name: 'bingimage',
        cmd: ['bing', 'bingimg', 'bingimage'],
        tags: 'Search Menu',
        desc: 'Cari gambar di Bing (Carousel)',
        run: async (xp, m, { args, command, usedPrefix }) => {
            const text = args.join(' ')
            if (!text) return m.reply(`*Contoh:* ${usedPrefix + command} kucing`)

            await xp.sendMessage(m.chat, { react: { text: '🔎', key: m.key } })

            try {
                // API 1: RestWave (Primary)
                let res = await axios.get(`https://www.restwave.my.id/search/gimage?q=${encodeURIComponent(text)}`).catch(() => null)
                let images = res?.data?.result ? res.data.result : null
                
                if (!images || images.length === 0) {
                     return m.reply('❌ Gambar tidak ditemukan.')
                }

                // Shuffle array to randomize results
                for (let i = images.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [images[i], images[j]] = [images[j], images[i]];
                }

                // Select top 5 images
                const selectedImages = images.slice(0, 5);
                const cards = [];

                for (const imgData of selectedImages) {
                    try {
                        const imgUrl = imgData.url || imgData;
                        const media = await prepareWAMessageMedia({ image: { url: imgUrl } }, { upload: xp.waUploadToServer });
                        
                        cards.push({
                            body: { text: `Bing Image: ${text}` },
                            header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                            nativeFlowMessage: { 
                                buttons: [{ 
                                    name: "cta_url", 
                                    buttonParamsJson: JSON.stringify({ 
                                        display_text: "🖼️ View HD", 
                                        url: imgUrl, 
                                        merchant_url: imgUrl 
                                    }) 
                                }] 
                            }
                        });
                    } catch (err) {
                        console.error('Error preparing card:', err);
                    }
                }

                if (cards.length > 0) {
                    await xp.relayMessage(m.chat, { 
                        viewOnceMessage: { 
                            message: { 
                                interactiveMessage: { 
                                    body: { text: "🖼️ *BING IMAGE SEARCH*" }, 
                                    header: { hasMediaAttachment: false }, 
                                    carouselMessage: { cards } 
                                } 
                            } 
                        } 
                    }, { quoted: m });
                } else {
                    m.reply('❌ Gagal memuat gambar.');
                }

            } catch (e) {
                console.error('BingImg Error:', e)
                m.reply(handleApiError(e))
            }
        }
    })
}
