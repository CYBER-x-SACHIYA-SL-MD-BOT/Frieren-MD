import crypto from "crypto";
import fetch from 'node-fetch'

export default function(ev) {
    ev.on({
        name: 'twitterstalk',
        cmd: ['twitterstalk', 'twstalk', 'xstalk'],
        tags: 'Tools Menu',
        desc: 'Stalk Profil Twitter/X',
        run: async (xp, m, { args, usedPrefix, command }) => {
            try {
                const text = args.join(' ');
                if (!text) return m.reply(`*Contoh:* ${usedPrefix || '.'}${command} mrbeast`);
                await xp.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

                const username = text.replace(/^@/, "").trim();

                const chRes = await fetch("https://twittermedia.b-cdn.net/challenge/", {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                        "Accept": "application/json",
                        "Origin": "https://snaplytics.io",
                        "Referer": "https://snaplytics.io/"
                    }
                });

                const ch = await chRes.json();
                if (!ch.challenge_id) throw new Error("Challenge gagal");

                const hash = crypto
                    .createHash("sha256")
                    .update(String(ch.timestamp) + ch.random_value)
                    .digest("hex")
                    .slice(0, 8);

                const dataRes = await fetch(
                    `https://twittermedia.b-cdn.net/viewer/?data=${encodeURIComponent(username)}&type=profile`,
                    {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                            "Accept": "application/json",
                            "Origin": "https://snaplytics.io",
                            "Referer": "https://snaplytics.io/",
                            "X-Challenge-ID": ch.challenge_id,
                            "X-Challenge-Solution": hash
                        }
                    }
                );

                const json = await dataRes.json();
                if (!json || !json.profile) throw new Error("Data tidak ditemukan");

                const p = json.profile;

                let caption = "\n🧭 *Hasil Pelacakan Profil X*\n\n👤 *Nama Pengguna:* ${p.name || \"Tidak Ditemukan\"}\n🔖 *Username / Handle:* @${username}\n${p.verified ? \"✅ *Akun Terverifikasi*\" : \"❌ *Akun Tidak Terverifikasi*\"}\n📝 *Bio / Deskripsi:*\n${p.bio ? `\"${p.bio}\" ` : \"(Tidak ada bio)\"}\n\n📊 *Statistik Akun*\n━━━━━━━━━━━━━━━━━━\n📈 *Jumlah Postingan:* ${p.stats?.tweets ?? 0}\n👁️ *Sedang Mengikuti:* ${p.stats?.following ?? 0}\n⭐ *Jumlah Pengikut:* ${p.stats?.followers ?? 0}\n━━━━━━━━━━━━━━━━━━\n\n📌 *Catatan:* Data ini diambil pada ${new Date().toLocaleDateString(\"id-ID\")}.\n";

                if (p.banner_url) {
                    await xp.sendMessage(
                        m.chat,
                        {
                            image: { url: p.banner_url },
                            caption
                        },
                        { quoted: m }
                    );
                } else if (p.avatar_url) {
                    await xp.sendMessage(
                        m.chat,
                        {
                            image: { url: p.avatar_url },
                            caption
                        },
                        { quoted: m }
                    );
                } else {
                    await m.reply(caption);
                }
            } catch (e) {
                await m.reply(`🍂 *Gagal mengambil data Twitter*\n\n📩 ${e.message}`);
            } finally {
                // await xp.sendMessage(m.chat, { react: { text: "", key: m.key } });
            }
        }
    })
}
