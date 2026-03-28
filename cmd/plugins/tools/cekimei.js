/**
 * @module plugins/tools/cekimei
 * @description Pengecekan status dan detail IMEI HP (API Varhad)
 */

import fetch from 'node-fetch';

let handler = async (m, { conn, text, usedPrefix, command }) => { 
    try {
        if (!text) return m.reply(`⚠️ *Format Salah!*

*Contoh:*
${usedPrefix + command} 354619000000000`);

        // Hapus spasi atau karakter non-angka yang mungkin dimasukkan user
        const cleanImei = text.replace(/[^0-9]/g, '');

        if (!/^\d{14,16}$/.test(cleanImei)) {
            return m.reply(`❌ *IMEI tidak valid.*
Pastikan panjang IMEI antara 14–16 digit angka.`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const res = await fetch(`https://api-varhad.my.id/tools/cekimei?q=${encodeURIComponent(cleanImei)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const json = await res.json();

        if (!json.status) {
            return m.reply(`❌ *Gagal mengambil data IMEI.*
Kemungkinan API sedang bermasalah atau IMEI salah.`);
        }

        const data = json.result?.result;
        if (!data || !data.header) {
            return m.reply(`❓ *Data IMEI tidak ditemukan di database.*`);
        }

        const header = data.header;
        const items = data.items || [];

        let caption = `📱 *IMEI CHECK RESULT*

`;
        caption += `*Brand:* ${header.brand || '-'}
`;
        caption += `*Model:* ${header.model || '-'}
`;
        caption += `*IMEI:* ${header.imei || '-'}

`;

        let currentSection = '';

        for (let item of items) {
            if (item.role === 'header') {
                currentSection = item.title;
                caption += `
🔍 *${currentSection}*
`;
            } else if (item.role === 'item' || item.role === 'button') {
                caption += `• *${item.title}:* ${item.content || '-'}
`;
            } else if (item.role === 'group' && Array.isArray(item.items)) {
                for (let sub of item.items) {
                    if (sub.role === 'button' || sub.role === 'item') {
                        caption += `• *${sub.title}:* ${sub.content || '-'}
`;
                    }
                }
            }
        }

        caption += `
*Service:* ${json.service || '-'}
`;
        caption += `*Data Status:* ${json.result.status || '-'}`;

        if (header.photo) {
            await conn.sendMessage(m.chat, {
                image: { url: header.photo },
                caption: caption.trim()
            }, { quoted: m });
        } else {
            await m.reply(caption.trim());
        }

    } catch (e) {
        console.error('Error cekimei:', e);
        await m.reply(`❌ *Terjadi kesalahan saat memproses permintaan IMEI.*
API mungkin sedang offline.`);
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(()=>{});
    }
};

handler.help = ['cekimei <nomor>'];
handler.tags = ['tools'];
handler.command = ['cekimei', 'imei'];
handler.limit = true;

export default handler;