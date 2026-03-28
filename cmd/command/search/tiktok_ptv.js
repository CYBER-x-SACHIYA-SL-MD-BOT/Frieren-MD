import axios from 'axios'

// Fungsi Search TikTok 
async function tiktokSearchVideo(query) {
    try {
        const response = await axios("https://tikwm.com/api/feed/search", {
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                cookie: "current_language=en",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
            },
            data: {
                keywords: query,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1,
            },
            method: "POST",
        })
        return response.data.data
    } catch (e) {
        return null
    }
}

export default function(ev) {
    ev.on({
        name: 'tiktokptv',
        cmd: ['ptv', 'ttptv'],
        tags: 'Search Menu',
        desc: 'Cari video TikTok dan kirim sebagai Video Note (PTV)',
        run: async (xp, m, { text, usedPrefix, command, isOwner }) => {
            if (!text) {
                return m.reply(
                    `⚠️ *TikTok PTV Search*\n\n` +
                    `Cari video TikTok dan kirim jadi video bulat.\n\n` +
                    `*Contoh:* ${usedPrefix + command} kucing\n` +
                    `*Owner Only:* ${usedPrefix + command} kucing --to 123456@g.us`
                );
            }

            let query = text
            let targetId = m.chat

            
            // Format: .ptv query --to ID
            if (text.includes('--to')) {
                if (!isOwner) return m.reply("⛔ Opsi --to hanya untuk Owner!");
                
                const split = text.split('--to');
                query = split[0].trim();
                targetId = split[1].trim();
                
                if (!targetId.includes('@')) targetId += '@g.us'; // Asumsi default ke grup jika tidak ada akhiran
            }

            try {
                // Feedback
                if (targetId !== m.chat) {
                    await m.reply(`⏳ Mencari "${query}" dan mengirim ke ${targetId}...`);
                } else {
                    await xp.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
                }

                const search = await tiktokSearchVideo(query);
                
                if (!search || !search.videos || search.videos.length === 0) {
                    return m.reply("❌ Video tidak ditemukan di TikTok.");
                }

                
                const randomIndex = Math.floor(Math.random() * search.videos.length);
                const videoData = search.videos[randomIndex];
                const videoUrl = `https://tikwm.com${videoData.play}`;

                await xp.sendMessage(
                    targetId,
                    {
                        video: { url: videoUrl },
                        ptv: true, // Mode Video Note
                        viewOnce: true // Opsional
                    },
                    { quoted: m } 
                );

                if (targetId !== m.chat) {
                    m.reply("✅ Terkirim.");
                }

            } catch (e) {
                console.error('PTV Error:', e);
                m.reply("🚨 Gagal mengirim PTV.");
            }
        }
    })
}
