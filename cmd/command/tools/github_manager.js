import axios from 'axios';
import AdmZip from 'adm-zip'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);
const configPath = path.join(dirname, '../../../system/set/config.json');

export default function(ev) {
    const getConfig = () => {
        try {
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
        } catch (e) {
            console.error('Error reading config:', e);
        }
        return {};
    }

    const checkConfig = (m) => {
        const cfg = getConfig();
        if (!cfg.github || !cfg.github.token || !cfg.github.username) {
            m.reply(`❌ Konfigurasi GitHub belum lengkap!
            
Silahkan tambahkan token dan username di file system/set/config.json:
"github": {
    "token": "TOKEN_GITHUB_ANDA",
    "username": "USERNAME_GITHUB_ANDA"
}`);
            return null;
        }
        return cfg.github;
    }

    // --- UPLOAD REPO ---
    ev.on({
        name: 'uploadrepo',
        cmd: ['uploadrepo', 'uprepo'],
        tags: 'Tools Menu',
        desc: 'Upload file ZIP ke GitHub Repo baru',
        owner: true,
        run: async (xp, m, { text, usedPrefix }) => {
            const ghConfig = checkConfig(m);
            if (!ghConfig) return;

            if (!text) return m.reply(`Contoh: ${usedPrefix}uploadrepo <nama_repo>`);

            const repoName = text.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
            if (!repoName) return m.reply('Nama repo tidak valid!');

            const quotedFile = m.quoted ? m.quoted : m;
            // Check if it's a document/zip
            if (!quotedFile.msg || !quotedFile.msg.mimetype || !/zip/i.test(quotedFile.msg.mimetype)) {
                return m.reply('Silakan kirim/reply file ZIP!');
            }

            try {
                await m.reply('⏳ Memproses file ZIP...');

                const zipBuffer = await quotedFile.download();
                
                // Check if repo exists
                try {
                    await axios.get(`https://api.github.com/repos/${ghConfig.username}/${repoName}`, {
                        headers: { 'Authorization': `token ${ghConfig.token}` }
                    });
                    return m.reply('❌ Repo dengan nama ini sudah ada!');
                } catch (e) {
                    if (e.response && e.response.status !== 404) throw e;
                }

                // Create Repo
                const repoRes = await axios.post('https://api.github.com/user/repos', {
                    name: repoName,
                    description: `Repo dari Mars Bot - ${repoName}`,
                    private: false,
                    auto_init: false
                }, {
                    headers: { 'Authorization': `token ${ghConfig.token}` }
                });

                const repoUrl = repoRes.data.html_url;

                // Process Zip
                const zip = new AdmZip(zipBuffer);
                const zipEntries = zip.getEntries();
                
                const uploadPromises = [];

                for (const entry of zipEntries) {
                    if (entry.isDirectory || entry.entryName.includes('__MACOSX') || entry.entryName.includes('.DS_Store')) continue;

                    const content = entry.getData().toString('base64');
                    const filePath = entry.entryName;

                    // GitHub API limit concurrent requests, maybe chunk?
                    // For now, simple push.
                    uploadPromises.push(async () => {
                         try {
                             await axios.put(`https://api.github.com/repos/${ghConfig.username}/${repoName}/contents/${filePath}`, {
                                message: `Add ${filePath}`,
                                content: content
                             }, {
                                headers: { 'Authorization': `token ${ghConfig.token}` }
                             });
                         } catch (err) {
                             console.error(`Failed to upload ${filePath}:`, err.message);
                         }
                    });
                }

                // Run uploads sequentially or in small batches to avoid rate limits
                for (const upload of uploadPromises) {
                    await upload();
                }

                m.reply(`✅ Berhasil mengupload repo ke GitHub!
🔗 Link: ${repoUrl}`);

            } catch (e) {
                console.error('Upload Repo Error:', e);
                m.reply(`❌ Gagal: ${e.message}`);
            }
        }
    });

    // --- DELETE REPO ---
    ev.on({
        name: 'deleterepo',
        cmd: ['deleterepo', 'delrepo'],
        tags: 'Tools Menu',
        desc: 'Hapus repository GitHub',
        owner: true,
        run: async (xp, m, { text }) => {
            const ghConfig = checkConfig(m);
            if (!ghConfig) return;

            if (!text) return m.reply(`Masukkan nama repo yang akan dihapus.`);

            const repoName = text.trim().toLowerCase();
            
            try {
                await m.reply(`⏳ Menghapus repo ${repoName}...`);
                await axios.delete(`https://api.github.com/repos/${ghConfig.username}/${repoName}`, {
                    headers: { 'Authorization': `token ${ghConfig.token}` }
                });
                m.reply(`✅ Berhasil menghapus repo ${repoName}`);
            } catch (e) {
                m.reply(`❌ Gagal: ${e.response?.status === 404 ? 'Repo tidak ditemukan' : e.message}`);
            }
        }
    });

    // --- CREATE REPO ---
    ev.on({
        name: 'createrepo',
        cmd: ['createrepo', 'newrepo'],
        tags: 'Tools Menu',
        desc: 'Buat repository baru',
        owner: true,
        run: async (xp, m, { text, args }) => {
            const ghConfig = checkConfig(m);
            if (!ghConfig) return;

            if (!text) return m.reply(`Format: .newrepo <nama> [deskripsi] [private]`);

            const repoName = args[0];
            const description = args.slice(1).filter(a => a !== 'private').join(' ') || `Created by Mars Bot`;
            const isPrivate = args.includes('private');

            try {
                const res = await axios.post('https://api.github.com/user/repos', {
                    name: repoName,
                    description: description,
                    private: isPrivate,
                    auto_init: true
                }, {
                    headers: { 'Authorization': `token ${ghConfig.token}` }
                });
                m.reply(`✅ Repo berhasil dibuat!
🔗 ${res.data.html_url}`);
            } catch (e) {
                m.reply(`❌ Gagal: ${e.message}`);
            }
        }
    });

    // --- LIST REPO ---
    ev.on({
        name: 'listrepo',
        cmd: ['listrepo', 'myrepo'],
        tags: 'Tools Menu',
        desc: 'List repository GitHub',
        owner: true,
        run: async (xp, m) => {
            const ghConfig = checkConfig(m);
            if (!ghConfig) return;

            try {
                const res = await axios.get('https://api.github.com/user/repos?per_page=100&sort=updated', {
                    headers: { 'Authorization': `token ${ghConfig.token}` }
                });
                
                if (!res.data.length) return m.reply('Belum ada repo.');

                let txt = `📋 *DAFTAR REPO GITHUB*
Total: ${res.data.length}

`;
                res.data.forEach((r, i) => {
                    txt += `${i+1}. *${r.name}* (${r.private ? '🔒' : '🌎'})
🔗 ${r.html_url}

`;
                });
                m.reply(txt);
            } catch (e) {
                m.reply(`❌ Gagal: ${e.message}`);
            }
        }
    });

    // --- REPO INFO ---
    ev.on({
        name: 'repoinfo',
        cmd: ['repoinfo'],
        tags: 'Tools Menu',
        desc: 'Informasi repository',
        owner: true,
        run: async (xp, m, { text }) => {
            const ghConfig = checkConfig(m);
            if (!ghConfig) return;

            if (!text) return m.reply('Masukkan nama repo.');

            try {
                const res = await axios.get(`https://api.github.com/repos/${ghConfig.username}/${text}`, {
                    headers: { 'Authorization': `token ${ghConfig.token}` }
                });
                const r = res.data;
                const txt = `📦 *INFO REPO*

Name: ${r.name}
Desc: ${r.description || '-'}
Stars: ${r.stargazers_count} | Forks: ${r.forks_count}
Private: ${r.private ? 'Yes' : 'No'}
URL: ${r.html_url}
Created: ${new Date(r.created_at).toLocaleDateString()}
Updated: ${new Date(r.updated_at).toLocaleDateString()}`;
                
                m.reply(txt);
            } catch (e) {
                m.reply(`❌ Gagal: ${e.message}`);
            }
        }
    });
}