import fetch from 'node-fetch'
import { sendIAMessage } from '../../../system/function.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia } = require('@adiwajshing/baileys');


export default function(ev) {
    ev.on({
        name: 'komiku_latest',
        cmd: ['komiku', 'komikulatest', 'newmanga'],
        tags: 'Search Menu',
        desc: 'Menampilkan update manga terbaru dari Komiku.id',
        run: async (xp, m, { chat }) => {
            try {
                await xp.sendMessage(chat.id, { react: { text: '📚', key: m.key } });

                const apiUrl = 'https://api.ootaizumi.web.id/manga/komiku-latest';
                const res = await fetch(apiUrl);
                const json = await res.json();

                if (!json.status || !json.result || json.result.length === 0) {
                    return m.reply('❌ Gagal mengambil data komik terbaru atau tidak ada update.');
                }

                const results = json.result.slice(0, 10); // Ambil 10 hasil teratas

                let txt = "📚 *UPDATE KOMIK TERBARU - KOMIKU.ID*\n\n";
                const cards = [];

                for (const comic of results) {
                    try {
                        const media = await prepareWAMessageMedia({ image: { url: comic.thumbnail } }, { upload: xp.waUploadToServer });
                        cards.push({
                            body: { text: `Chapter: ${comic.chapter}\nDirilis: ${comic.release}` },
                            header: {
                                hasMediaAttachment: true,
                                imageMessage: media.imageMessage
                            },
                            nativeFlowMessage: {
                                buttons: [{
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📖 Baca Sekarang",
                                        url: comic.url,
                                        merchant_url: comic.url // Fallback
                                    })
                                }]
                            }
                        });
                    } catch (e) {
                        console.error(`Failed to process media for ${comic.title}:`, e);
                    }
                }
                
                if (cards.length > 0) {
                     await xp.relayMessage(chat.id, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    body: { text: `Berikut adalah 10 update komik terbaru dari Komiku.id` },
                                    header: { hasMediaAttachment: false, title: "KOMIKU LATEST" },
                                    carouselMessage: { cards }
                                }
                            }
                        }
                    }, {});
                } else {
                    // Fallback to text if carousel fails
                    results.forEach(comic => {
                        txt += `*${comic.title}*\n`;
                        txt += `├ Chapter: ${comic.chapter}\n`;
                        txt += `├ Rilis: ${comic.release}\n`;
                        txt += `└ Link: ${comic.url}\n\n`;
                    });
                    m.reply(txt);
                }

            } catch (e) {
                console.error("Komiku Latest Error:", e);
                m.reply('❌ Gagal mengambil data dari API.');
            }
        }
    });
}
