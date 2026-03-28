import fetch from 'node-fetch';

export default function(ev) {
    ev.on({
        name: 'iplookup',
        cmd: ['cekip', 'iplookup', 'ipinfo', 'ceklokasi', 'ipcheck'],
        tags: 'Search Menu',
        desc: 'Cek informasi lokasi dari alamat IP via ip-api.com',
        run: async (xp, m, { args }) => {
            const ip = args[0];
            if (!ip || !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
                return m.reply('Format salah. Gunakan: .cekip <alamat_ip>\nContoh: .cekip 8.8.8.8');
            }

            try {
                await xp.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });

                // Menggunakan ip-api.com (Free, No Token)
                const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
                const data = await res.json();

                if (data.status !== 'success') {
                    return m.reply(`Gagal melacak IP: ${data.message || 'Error tidak diketahui.'}`);
                }
                
                const lat = data.lat;
                const lon = data.lon;

                let txt = `🌐 *IP GEOLOCATION (ip-api)*\n`
                txt += `━━━━━━━━━━━━━━━━━\n`
                txt += `📍 *IP Address:* ${data.query}\n`
                txt += `\n🌍 *Lokasi Geografis:*\n`
                txt += `   *Negara:* ${data.country || 'N/A'} (${data.countryCode || 'N/A'})\n`
                txt += `   *Region:* ${data.regionName || 'N/A'}\n`
                txt += `   *Kota:* ${data.city || 'N/A'}\n`
                txt += `   *Kode Pos:* ${data.zip || 'N/A'}\n`
                txt += `   *Zona Waktu:* ${data.timezone || 'N/A'}\n`
                txt += `   *Koordinat:* ${lat}, ${lon}\n`
                txt += `\n📡 *Informasi Jaringan:*\n`
                txt += `   *ISP:* ${data.isp || 'N/A'}\n`
                txt += `   *Org:* ${data.org || 'N/A'}\n`
                txt += `   *AS:* ${data.as || 'N/A'}\n`
                txt += `━━━━━━━━━━━━━━━━━`

                // Kirim pesan teks dulu
                await m.reply(txt);

                // Kirim lokasi di peta untuk visual
                if (lat && lon) {
                    await xp.sendMessage(m.chat, {
                        location: {
                            degreesLatitude: parseFloat(lat),
                            degreesLongitude: parseFloat(lon),
                            name: `${data.city}, ${data.country}`
                        }
                    }, { quoted: m });
                }

            } catch (e) {
                console.error(e);
                m.reply('Terjadi kesalahan saat menghubungi layanan IP API.');
            }
        }
    });
}
