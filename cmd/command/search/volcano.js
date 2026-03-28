import fetch from 'node-fetch'

export default function(ev) {
    ev.on({
        name: 'volcano',
        cmd: ['volcano', 'gunungapi'],
        tags: 'Information Menu',
        desc: 'Info gunung berapi di Indonesia',
        run: async (xp, m, { args, chat, usedPrefix, command }) => {
            try {
                await xp.sendMessage(chat.id, { react: { text: "⏳", key: m.key } });

                let res = await fetch("https://indonesia-public-static-api.vercel.app/api/volcanoes");
                if (!res.ok) throw new Error("Fetch gagal");

                let data = await res.json();
                if (!Array.isArray(data) || !data.length) {
                    return m.reply("🍂 *Data gunung berapi tidak tersedia.*");
                }

                let max = 150;
                let total = Math.min(data.length, max);
                let start = 0;
                let end = 10;
                const text = args[0]

                if (text) {
                    let num = parseInt(text);
                    if (isNaN(num) || num < 1 || num > total) {
                        return m.reply(`🍂 *Nomor tidak valid.*
Gunakan angka *1–${total}*`);
                    }

                    let v = data[num - 1];
                    return m.reply(
                        `🌋 *DATA GUNUNG BERAPI*

` +
                        `🔢 *Nomor:* ${num}
` +
                        `🏔️ *Nama:* ${v.nama || "N/A"}
` +
                        `🧱 *Bentuk:* ${v.bentuk || "N/A"}
` +
                        `📏 *Tinggi:* ${v.tinggi_meter || "N/A"}
` +
                        `🔥 *Letusan Terakhir:* ${v.estimasi_letusan_terakhir || "N/A"}
` +
                        `📍 *Lokasi:* ${v.geolokasi || "N/A"}`
                    );
                }

                let output = data.slice(start, end).map((v, i) => {
                    return [
                        `🌋 *${i + 1}. ${v.nama || "Tidak diketahui"}*`,
                        `• *Bentuk:* ${v.bentuk || "N/A"}`,
                        `• *Tinggi:* ${v.tinggi_meter || "N/A"}`,
                        `• *Letusan Terakhir:* ${v.estimasi_letusan_terakhir || "N/A"}`,
                        `• *Lokasi:* ${v.geolokasi || "N/A"}`
                    ].join("\n");
                }).join("\n\n");

                await m.reply(
                    `📊 *DAFTAR GUNUNG BERAPI INDONESIA (1–10)*
` +
                    `Total data tersedia: *${total}*

` +
                    output +
                    `

📌 *Gunakan:* ${usedPrefix || '.'}${command} <nomor>
Contoh: *${usedPrefix || '.'}${command} 11*`
                );
            } catch (e) {
                console.error(e)
                await m.reply("🍂 *Terjadi kesalahan saat memproses data.*");
            } finally {
                // await xp.sendMessage(chat.id, { react: { text: "", key: m.key } });
            }
        }
    })
}