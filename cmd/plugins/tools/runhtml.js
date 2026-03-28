/**
 * @module plugins/tools/runhtml
 * @description Live Server / HTML Previewer (Generate URL untuk Web)
 */

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`*🌐 LIVE HTML SERVER 🌐*

Ubah kodingan HTML/CSS/JS kamu menjadi link website yang bisa dibuka di browser secara instan!

*Format:*
${usedPrefix + command} <code>

*Contoh:*
${usedPrefix + command} <html><body><h1>Halo Dunia!</h1></body></html>`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        // Buat file HTML sementara
        const fileName = `preview_${Date.now()}.html`;
        const filePath = path.join('./temp', fileName);
        
        // Pastikan folder temp ada
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
        
        // Simpan kode user ke dalam file
        fs.writeFileSync(filePath, text);

        // Siapkan form data untuk upload ke Catbox
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', ''); // Anonymous upload
        form.append('fileToUpload', fs.createReadStream(filePath));

        // Upload ke server Catbox (yang mendukung render HTML)
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Hapus file sementara
        fs.unlinkSync(filePath);

        if (response.data && response.data.startsWith('http')) {
            const previewUrl = response.data;
            
            let msg = `🌐 *LIVE PREVIEW BERHASIL!* 🌐

`;
            msg += `Website kamu sudah online dan bisa diakses melalui link di bawah ini:

`;
            msg += `🔗 *Link:* ${previewUrl}

`;
            msg += `_Catatan: Buka link tersebut di browser (Chrome/Safari) untuk melihat hasilnya._`;

            await conn.sendMessage(m.chat, { text: msg }, { quoted: m });
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (e) {
        console.error('RunHTML Error:', e.message);
        m.reply('❌ Gagal mengunggah kode ke Live Server. Coba beberapa saat lagi.');
    }
};

handler.help = ['runhtml <code>', 'live <code>'];
handler.tags = ['tools'];
handler.command = ['runhtml', 'live', 'preview', 'html'];
handler.limit = true;

export default handler;