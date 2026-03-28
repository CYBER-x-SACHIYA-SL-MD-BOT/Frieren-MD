/*
• Feature : deploy vercel v2
• Credits : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
• doksli : alip/lippwangsaf own nefusoft
• Adapted for frieren-md by Har (Converted to use adm-zip & axios)
*/

import AdmZip from 'adm-zip';
import axios from 'axios';

const getVercelToken = () => process.env.VERCEL_TOKEN || global.vercelToken || ''

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Contoh: ${usedPrefix + command} <nama_web>`;
  
  const token = getVercelToken()
  if (!token) return m.reply(`❌ Token Vercel belum diset. Gunakan .setvercel <token>`)

  const webName = text.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const domainCheckUrl = `https://${webName}.vercel.app`;

  try {
    const check = await axios.get(domainCheckUrl).catch(e => e.response);
    if (check && check.status === 200) return m.reply(`❌ Nama web *${webName}* sudah digunakan. Silakan gunakan nama lain.`);
  } catch (e) {}

  const quotedFile = m.quoted ? m.quoted : m;
  const mime = (quotedFile.msg || quotedFile).mimetype || quotedFile.mediaType || '';

  const filesToUpload = [];
  if (/zip/.test(mime) || mime.includes('application/zip')) {
    m.reply('⏳ Sedang memproses file ZIP, mohon tunggu...');
    const zipBuffer = await quotedFile.download();
    
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
        if (!entry.isDirectory) {
            const content = entry.getData()
            const filePath = entry.entryName.replace(/^\/+/, '').replace(/\\/g, '/');
            filesToUpload.push({ 
                file: filePath, 
                data: content.toString('base64'), 
                encoding: 'base64' 
            });
        }
    }
    
    if (!filesToUpload.some(x => x.file.toLowerCase().endsWith('index.html'))) {
      return m.reply('File index.html tidak ditemukan dalam struktur ZIP.');
    }
  } else if (/html/.test(mime)) {
    m.reply('⏳ Sedang memproses file HTML, mohon tunggu...');
    const content = await quotedFile.download();
    filesToUpload.push({ file: 'index.html', data: content.toString('base64'), encoding: 'base64' });
  } else {
    return m.reply('File tidak dikenali. Kirim file .zip atau .html.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  await axios.post('https://api.vercel.com/v9/projects', { name: webName }, { headers }).catch(() => {});

  try {
      const deployRes = await axios.post('https://api.vercel.com/v13/deployments', {
          name: webName,
          project: webName,
          files: filesToUpload,
          projectSettings: { framework: null },
          target: 'production'
      }, { headers });

      const deployData = deployRes.data;
      if (!deployData || !deployData.url) {
        console.log('Deploy Error:', deployData);
        return m.reply(`Gagal deploy ke Vercel.`);
      }

      m.reply(`✅ Website berhasil dibuat!

🌐 URL: https://${webName}.vercel.app`);
  } catch (e) {
      console.error(e.response?.data || e)
      m.reply(`Gagal Deploy: ${e.response?.data?.error?.message || e.message}`)
  }
};

handler.help = ['deployweb'];
handler.tags = ['owner'];
handler.command = ['deployweb', 'deploy2'];
handler.owner = true;

export default handler;