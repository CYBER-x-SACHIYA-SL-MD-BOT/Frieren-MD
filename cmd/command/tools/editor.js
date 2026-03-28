import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// Fungsi Upload ke Catbox (Support Buffer)
async function CatBox(buffer) {
    try {
        const formData = new FormData();
        formData.append('fileToUpload', buffer, { filename: 'image.jpg' });
        formData.append('reqtype', 'fileupload');
        formData.append('userhash', ''); 

        const response = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error at Catbox uploader:", error);
        return null;
    }
}

export default function editor(ev) {

  // --- TO ANIME ---
  ev.on({
    name: 'toanime',
    cmd: ['toanime', 'jadianime'],
    tags: 'Editor Menu',
    desc: 'Mengubah foto menjadi anime',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const image = quoted?.imageMessage || m.message?.imageMessage;

            if (!image) return xp.sendMessage(chat.id, { text: 'Kirim/Reply gambar dengan caption .toanime' }, { quoted: m });

            await xp.sendMessage(chat.id, { react: { text: '🎨', key: m.key } });

            const media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer');
            const imageUrl = await CatBox(media);

            if (!imageUrl) return xp.sendMessage(chat.id, { text: 'Gagal mengupload gambar.' }, { quoted: m });

            const apiUrl = `https://fastrestapis.fasturl.cloud/imgedit/aiimage?prompt=Anime&reffImage=${encodeURIComponent(imageUrl)}&style=AnimageModel&width=1024&height=1024&creativity=0.5`;

            await xp.sendMessage(chat.id, { image: { url: apiUrl }, caption: 'Success Convert To Anime' }, { quoted: m });

        } catch (e) {
            console.error(e);
            xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat memproses gambar.' }, { quoted: m });
        }
    }
  });

  // --- TO REALISTIC ---
  ev.on({
    name: 'toreal',
    cmd: ['toreal', 'jadinyata'],
    tags: 'Editor Menu',
    desc: 'Mengubah foto anime/kartun menjadi realistis',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const image = quoted?.imageMessage || m.message?.imageMessage;

            if (!image) return xp.sendMessage(chat.id, { text: 'Kirim/Reply gambar dengan caption .toreal' }, { quoted: m });

            await xp.sendMessage(chat.id, { react: { text: '📸', key: m.key } });

            const media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer');
            const imageUrl = await CatBox(media);

            if (!imageUrl) return xp.sendMessage(chat.id, { text: 'Gagal mengupload gambar.' }, { quoted: m });

            const apiUrl = `https://fastrestapis.fasturl.cloud/imgedit/aiimage?prompt=Anime&reffImage=${encodeURIComponent(imageUrl)}&style=RealisticModel&width=1024&height=1024&creativity=0.5`;

            await xp.sendMessage(chat.id, { image: { url: apiUrl }, caption: 'Success Convert To Realistic' }, { quoted: m });

        } catch (e) {
            console.error(e);
            xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat memproses gambar.' }, { quoted: m });
        }
    }
  });

  // --- REMOVE BACKGROUND ---
  ev.on({
    name: 'removebg',
    cmd: ['removebg'],
    tags: 'Editor Menu',
    desc: 'Menghapus latar belakang foto',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const image = quoted?.imageMessage || m.message?.imageMessage;

            if (!image) return xp.sendMessage(chat.id, { text: 'Kirim/Reply gambar dengan caption .removebg' }, { quoted: m });

            await xp.sendMessage(chat.id, { react: { text: '✂️', key: m.key } });

            const media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer');
            const imageUrl = await CatBox(media);

            if (!imageUrl) return xp.sendMessage(chat.id, { text: 'Gagal mengupload gambar.' }, { quoted: m });

            const apiUrl = `https://api.siputzx.my.id/api/iloveimg/removebg?image=${imageUrl}`;

            await xp.sendMessage(chat.id, { image: { url: apiUrl }, caption: 'Background Removed' }, { quoted: m });

        } catch (e) {
            console.error(e);
            xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat menghapus background.' }, { quoted: m });
        }
    }
  });

  // --- FACE BLUR ---
  ev.on({
    name: 'faceblur',
    cmd: ['faceblur', 'blurface'],
    tags: 'Editor Menu',
    desc: 'Memburamkan wajah dalam foto',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const image = quoted?.imageMessage || m.message?.imageMessage;

            if (!image) return xp.sendMessage(chat.id, { text: 'Kirim/Reply gambar dengan caption .faceblur' }, { quoted: m });

            await xp.sendMessage(chat.id, { react: { text: '😶', key: m.key } });

            const media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer');
            const imageUrl = await CatBox(media);

            if (!imageUrl) return xp.sendMessage(chat.id, { text: 'Gagal mengupload gambar.' }, { quoted: m });

            const apiUrl = `https://api.siputzx.my.id/api/iloveimg/blurface?image=${imageUrl}`;

            await xp.sendMessage(chat.id, { image: { url: apiUrl }, caption: 'Face Blurred' }, { quoted: m });

        } catch (e) {
            console.error(e);
            xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat memproses gambar.' }, { quoted: m });
        }
    }
  });

}
