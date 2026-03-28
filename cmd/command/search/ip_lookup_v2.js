import fetch from 'node-fetch';

export default function(ev) {
    ev.on({
        name: 'iplookup_v2',
        cmd: ['cekipv2', 'ipcheck2'],
        tags: 'Search Menu',
        desc: 'Cek lokasi IP (Versi UI Enhanced)',
        run: async (xp, m, { args, command, usedPrefix }) => {
            const ip = args[0];
            if (!ip || !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
                return m.reply(`*Contoh:* ${usedPrefix + command} 8.8.8.8`);
            }

            try {
                await xp.sendMessage(m.chat, { react: { text: '🛰️', key: m.key } });

                const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon`);
                const data = await res.json();

                if (data.status !== 'success') {
                    return m.reply(`❌ Gagal mendapatkan informasi untuk IP: ${ip}.\nReason: ${data.message}`);
                }
                
                let txt = `🛰️ *IP LOOKUP V2*\n`;
                txt += `━━━━━━━━━━━━━━━━━\n`;
                txt += `📍 *IP Address:* ${ip}\n`;
                txt += `\n🌍 *Lokasi Geografis:*\n`;
                txt += `   *Negara:* ${data.country || 'N/A'} (${data.countryCode || 'N/A'})\n`;
                txt += `   *Region:* ${data.regionName || 'N/A'}\n`;
                txt += `   *Kota:* ${data.city || 'N/A'}\n`;
                txt += `   *Koordinat:* ${data.lat}, ${data.lon}\n`;
                txt += `━━━━━━━━━━━━━━━━━`;
                
                // Kirim pesan teks dengan UI yang bagus
                await xp.sendMessage(m.chat, {
                    text: txt,
                    contextInfo: {
                        externalAdReply: {
                            title: `IP Lookup: ${ip}`,
                            body: `${data.city || 'Unknown City'}, ${data.country || 'Unknown Country'}`,
                            thumbnailUrl: global.thumbnail, // Menggunakan thumbnail global bot
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            sourceUrl: `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}`
                        }
                    }
                }, { quoted: m });

            } catch (e) {
                console.error("IPLookupV2 Error:", e);
                m.reply('Terjadi kesalahan saat memproses permintaan lookup IP.');
            }
        }
    });
}
