import * as cheerio from "cheerio";
import fetch from 'node-fetch';

export default function(ev) {
    ev.on({
        name: 'waparse',
        cmd: ['waparse', 'wachannel', 'channelinfo'],
        tags: 'Tools Menu',
        desc: 'Parse Info WhatsApp Channel',
        run: async (xp, m, { args, usedPrefix, command }) => {
            const text = args.join(' ');
            try {
                if (!text) return m.reply(`*Contoh:* ${usedPrefix || '.'}${command} https://whatsapp.com/channel/xxxxx`);
                await xp.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

                let url = text.trim();
                let regex = /^https:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+/i;

                if (!regex.test(url)) {
                    return m.reply("🍂 *URL tidak valid.* Pastikan link WhatsApp Channel publik.");
                }

                let res = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0"
                    }
                });

                if (!res.ok) {
                    return m.reply("🍂 *Gagal mengambil halaman channel.*");
                }

                let html = await res.text();
                let $ = cheerio.load(html);

                let name = $("meta[property='og:title']").attr("content") || "Tidak diketahui";
                let description = $("meta[property='og:description']").attr("content") || "";
                let image = $("meta[property='og:image']").attr("content") || null;

                let followers = null;
                // Regex updated to catch "3.5M followers" style description if present
                let match = description.match(/([\d,.]+[KMB]?)\s*followers/i);
                let followersText = "Tidak diketahui";

                if (match) {
                    followersText = match[1];
                }

                let caption = `📢 *Wa Channel Parse*

🧩 *Nama Channel:* ${name}
👥 *Followers:* ${followersText}
📝 *Deskripsi:* ${description || "Tidak tersedia"}

🔗 *Source:* ${url}`;

                if (image) {
                    await xp.sendMessage(m.chat, {
                        image: { url: image },
                        caption
                    }, { quoted: m });
                } else {
                    await m.reply(caption);
                }
            } catch (e) {
                console.error(e);
                await m.reply("🍂 *Terjadi error saat parsing channel.*");
            } finally {
                // await xp.sendMessage(m.chat, { react: { text: "", key: m.key } });
            }
        }
    })
}