/**
 * @module plugins/search/ttsearch
 * @description Cari video TikTok menggunakan API FAA
 */

import axios from 'axios'
import { createUrl } from '#system/apis.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia } = require('@adiwajshing/baileys');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Mencari video tiktok?\nContoh: *${usedPrefix + command}* Alya`)

    await m.reply('⏳ _Searching TikTok..._')

    try {
        // Use createUrl from system/apis.js
        const apiUrl = createUrl('faa', '/faa/tiktok-search', { q: text })
        const { data } = await axios.get(apiUrl)
        
        if (!data.status || !data.result || data.result.length === 0) {
            return m.reply('❌ Video tidak ditemukan.')
        }

        const cards = []
        // Limit to 5 results
        for (const v of data.result.slice(0, 5)) {
            try {
                const title = v.title || 'No Caption'
                const author = v.author ? v.author.nickname : 'Unknown'
                const views = v.stats ? v.stats.views : '0'
                const cover = v.cover
                const url = v.url_nowm || v.url_wm

                // Prepare Image
                const media = await prepareWAMessageMedia({ image: { url: cover } }, { upload: conn.waUploadToServer })

                cards.push({
                    body: { text: title.length > 50 ? title.substring(0, 47) + '...' : title },
                    footer: { text: `👤 ${author} | 👀 ${views}` },
                    header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🎥 Get Video",
                                    id: `.tiktok ${url}`
                                })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🔗 Watch",
                                    url: v.url_wm || url,
                                    merchant_url: v.url_wm || url
                                })
                            }
                        ]
                    }
                })
            } catch (err) {
                console.error('Error card:', err)
            }
        }

        if (cards.length === 0) return m.reply('Gagal memuat hasil.')

        await conn.relayMessage(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: `🎵 *TIKTOK SEARCH RESULT*\n🔎 Query: ${text}` },
                        header: { hasMediaAttachment: false },
                        carouselMessage: { cards }
                    }
                }
            }
        }, { quoted: m })

    } catch (e) {
        console.error('TTSearch Error:', e)
        m.reply('❌ Terjadi kesalahan saat mencari video.')
    }
}

handler.help = ['ttsearch <query>']
handler.tags = ['search']
handler.command = ['ttsearch', 'tiksearch', 'tiktoksearch']

export default handler