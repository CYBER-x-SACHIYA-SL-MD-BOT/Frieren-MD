/**
 * @module plugins/search/pontianaknews
 * @description Scraper Berita Pontianak News (Fixed 403/Access Error)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia } = require('@adiwajshing/baileys');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

const handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        // --- BACA ARTIKEL LANGSUNG DI WA ---
        if (command === 'bacapnknews' || (args[0] && args[0].startsWith('http'))) {
            const url = args[0];
            if (!url || !url.includes('pontianaknews.com')) return m.reply('❌ URL tidak valid atau bukan dari Pontianak News.');
            
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            
            const fetchUrl = url.includes('?page=all') ? url : url + '?page=all';
            
            const { data } = await axios.get(fetchUrl, { headers: HEADERS });
            const $ = cheerio.load(data);
            
            const title = $('h1.read__title').text().trim() || $('h1').first().text().trim() || 'Judul Tidak Ditemukan';
            const date = $('.read__info__date').text().trim() || $('time').first().text().trim() || '';
            
            let content = '';
            $('.read__article p, .article-content p, article p').each((i, el) => {
                const text = $(el).text().trim();
                if (text && 
                    !text.toLowerCase().includes('baca juga:') && 
                    !text.toLowerCase().includes('penulis:') && 
                    !text.toLowerCase().includes('editor:')) {
                    content += text + '\n\n';
                }
            });
            
            if (!content) return m.reply('❌ Gagal mengekstrak isi berita dari link tersebut.');
            
            const txt = `📰 *${title}*\n📅 ${date}\n\n${content.trim()}\n\n🔗 _Sumber: ${url}_`;
            const imgUrl = $('.read__photo img').first().attr('src') || $('article img').first().attr('src') || null;
            
            if (imgUrl) {
                await conn.sendMessage(m.chat, { 
                    image: { url: imgUrl }, 
                    caption: txt 
                }, { quoted: m });
            } else {
                await m.reply(txt);
            }
            return;
        }


        // --- LIST BERITA (CAROUSEL) ---
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const { data: html } = await axios.get('https://www.pontianaknews.com/', { headers: HEADERS });
        const results = [];
        const regex = /<a[^>]*href="(https:\/\/www\.pontianaknews\.com\/[a-zA-Z0-9-]+\/\d+\/[^"?]+)"[^>]*>(.*?)<\/a>/gs;
        
        let match;
        const seen = new Set();
        
        while ((match = regex.exec(html)) !== null) {
            const link = match[1];
            let innerHtml = match[2];
            let title = innerHtml.replace(/<[^>]+>/g, '').trim();
            title = title
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\n/g, ' ')
                .replace(/\s{2,}/g, ' ');
            
            if (!seen.has(link) && title.length > 20) {
                seen.add(link);
                results.push({ title, link });
            }
            if (results.length >= 10) break;
        }

        if (results.length === 0) return m.reply('❌ Tidak menemukan berita terbaru saat ini.');

        const cards = [];
        for (const v of results.slice(0, 5)) { 
            try {
                const media = await prepareWAMessageMedia({ image: { url: "https://c.termai.cc/i205/xJ7.png" } }, { upload: conn.waUploadToServer }).catch(() => null);
                
                cards.push({
                    body: { text: v.title },
                    footer: { text: "Pontianak News" },
                    header: media ? { hasMediaAttachment: true, imageMessage: media.imageMessage } : { hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "📖 Baca Disini",
                                    id: `${usedPrefix}bacapnknews ${v.link}`
                                })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🌐 Buka Link",
                                    url: v.link,
                                    merchant_url: v.link
                                })
                            }
                        ]
                    }
                });
            } catch (err) { }
        }

        if (cards.length > 0) {
            await conn.relayMessage(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: "📰 *BERITA TERBARU PONTIANAK NEWS*" },
                            header: { hasMediaAttachment: false },
                            carouselMessage: { cards }
                        }
                    }
                }
            }, { quoted: m });
        } else {
            m.reply('❌ Gagal membuat carousel berita.');
        }

    } catch (e) {
        console.error('Error pontianak news:', e.message);
        m.reply(`❌ Terjadi kesalahan: API/Situs memblokir akses.`);
    }
};

handler.help = ['pontianaknews', 'bacapnknews <url>'];
handler.tags = ['search'];
handler.command = ['pnknews', 'pontianaknews', 'beritapnknews', 'bacapnknews'];
handler.limit = true; 

export default handler;