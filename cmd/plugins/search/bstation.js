/**
 * @module plugins/search/bstation
 * @description Search Bstation/Bilibili videos (Carousel) via Ryzumi API
 */

import axios from 'axios'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia } = require('@adiwajshing/baileys');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*Contoh:* ${usedPrefix + command} Alya`)

    await m.reply('⏳ _Searching Bstation..._')

    try {
        const { data } = await axios.get(`https://api.ryzumi.net/api/search/bilibili?query=${encodeURIComponent(text)}`)

        if (!data || data.length === 0) return m.reply('❌ Video tidak ditemukan.')

        const cards = []
        // Limit 10 results for carousel
        for (const v of data.slice(0, 10)) {
            try {
                const media = await prepareWAMessageMedia({ image: { url: v.thumbnail } }, { upload: conn.waUploadToServer })
                
                cards.push({
                    body: { text: v.title.length > 50 ? v.title.substring(0, 47) + '...' : v.title },
                    footer: { text: `👀 ${v.views} | ⏱️ ${v.duration} | 👤 ${v.uploader}` },
                    header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "📺 Tonton",
                                    url: v.url,
                                    merchant_url: v.url
                                })
                            }
                        ]
                    }
                })
            } catch (err) {
                console.error('Error preparing card:', err)
            }
        }

        if (cards.length === 0) return m.reply('Gagal memuat carousel.')

        await conn.relayMessage(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: `📺 *HASIL PENCARIAN BSTATION*\n🔎 Query: ${text}` },
                        header: { hasMediaAttachment: false },
                        carouselMessage: { cards }
                    }
                }
            }
        }, { quoted: m })

    } catch (e) {
        console.error('Bstation Error:', e)
        m.reply('❌ Terjadi kesalahan saat mencari video.')
    }
}

handler.help = ['bstation <query>']
handler.tags = ['search', 'anime']
handler.command = ['bstation', 'bilibili', 'bili']
handler.prefix = true

export default handler