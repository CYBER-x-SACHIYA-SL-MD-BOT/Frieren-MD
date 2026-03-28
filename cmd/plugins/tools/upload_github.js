/**
 * @module plugins/tools/upload_github
 * @author Har404-err (Ported to FrierenBot)
 */

import fetch from 'node-fetch'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// --- CONFIGURATION ---
// Isi dengan Token & Repo Anda atau simpan di config.json/env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN'; 
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'YOUR_GITHUB_USERNAME';
const GITHUB_REPO = process.env.GITHUB_REPO || 'YOUR_GITHUB_REPO';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m;
    // Fix mimetype detection logic for quoted msg structure
    const msg = q.msg || q;
    const mime = msg.mimetype || '';
    
    if (!mime) return m.reply(`Kirim/Reply file yang mau diupload ke GitHub.`);

    let path = args[0];
    const ext = mime.split('/')[1] || 'bin';

    // Auto Rename Logic
    if (!path) {
        path = `uploads/file_${Date.now()}.${ext}`;
    } else {
        // Auto Extension Check
        if (!path.includes('.')) path += `.${ext}`;
    }

    if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN') {
        return m.reply('❌ GitHub Token belum disetting di plugin/env!');
    }

    await m.reply('⏳ *Uploading to GitHub...*');

    try {
        // 0. Get Default Branch
        const repoRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'FrierenBot-Uploader' }
        });
        const repoData = await repoRes.json();
        const targetBranch = repoData.default_branch || 'main'; // Fallback main if fail

        // FIXED DOWNLOAD LOGIC
        let media;
        try {
            // Reconstruct message structure for downloader
            const msgToDownload = {
                key: q.key,
                message: q.message || { [q.mtype]: q.msg }
            };
            
            media = await downloadMediaMessage(msgToDownload, 'buffer');
            if (!media) throw new Error("Media buffer kosong.");
        } catch (e) {
            console.error('[UploadGH] Download Error:', e.message);
            return m.reply(`❌ Gagal mendownload media: ${e.message}\nSilakan coba lagi.`);
        }
        
        const content = media.toString('base64');

        // 1. Cek apakah file sudah ada (untuk dapatkan SHA jika mau update/overwrite)
        let sha = null;
        try {
            const checkUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${targetBranch}`;
            const checkRes = await fetch(checkUrl, {
                headers: { 
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'User-Agent': 'FrierenBot-Uploader'
                }
            });
            if (checkRes.ok) {
                const data = await checkRes.json();
                sha = data.sha;
                await m.reply('⚠️ File sudah ada, melakukan overwrite...');
            }
        } catch (e) {}

        // 2. Upload (PUT)
        const uploadUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
        const body = {
            message: `Upload via FrierenBot: ${path}`,
            content: content,
            branch: targetBranch
        };
        if (sha) body.sha = sha;

        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'FrierenBot-Uploader'
            },
            body: JSON.stringify(body)
        });

        const json = await res.json();

        if (res.ok) {
            const rawUrl = json.content?.download_url || `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${targetBranch}/${path}`;
            const htmlUrl = json.content?.html_url;

            m.reply(`✅ *UPLOAD SUKSES*
            
📂 Path: 
${path}
🔗 Raw: ${rawUrl}
🌐 View: ${htmlUrl}

_File berhasil disimpan di repository._`);
        } else {
            throw new Error(json.message || 'Unknown Error');
        }

    } catch (e) {
        console.error(e);
        m.reply(`❌ Upload Gagal: ${e.message}`);
    }
};

handler.help = ["pushrepo <path>"];
handler.tags = ["tools"];
handler.command = ['pushrepo', 'uprepo', 'gitpush'];
handler.owner = true; // Safety

export default handler;