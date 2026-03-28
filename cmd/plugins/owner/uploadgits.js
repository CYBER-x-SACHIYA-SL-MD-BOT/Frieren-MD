/**
 * @module plugins/owner/uploadgits
 * @description Upload code or files to your GitHub Gist
 */

import axios from 'axios'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
   const GITHUB_TOKEN = process.env.GITHUB_TOKEN

   if (!GITHUB_TOKEN) {
      return m.reply(`⚠️ *GitHub Token Belum Terisi!*

Untuk mengunggah kode ke GitHub kamu, saya butuh Personal Access Token.
1. Buat token di GitHub (centang izin 'gist').
2. Masukkan token dengan perintah:
   \`${usedPrefix}settokengh <token_kamu>\`
Atau edit file .env`)
   }

   let content = ''
   let fileName = ''

   // Check flags
   const isPrivate = args.includes('--private')
   const cleanArgs = args.filter(a => !a.startsWith('--'))
   const cleanText = cleanArgs.join(' ')

   if (m.quoted && m.quoted.text) {
      content = m.quoted.text
      fileName = cleanText.trim() || `joybot_${Date.now()}.js`
   } else if (cleanText && fs.existsSync(cleanText)) {
      content = fs.readFileSync(cleanText, 'utf-8')
      fileName = path.basename(cleanText)
   } else {
      return m.reply(`╭───「 *UPLOADER TO GIST* 」───
│
│ 📤 *Cara Pakai:*
│ 1. Reply kode yg ingin di upload.
│ 2. Ketik: ${usedPrefix + command} nama_file.js [--private]
│
│ 📂 *Atau upload file bot:*
│ Ketik: ${usedPrefix + command} fun/sawit.js
│
╰────────────────────`)
   }

   try {
      await m.reply('⏳ Sedang mengunggah ke GitHub Gist...')

      const description = `Uploaded by Frieren MD - Bot | ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`

      const payload = {
         description,
         public: !isPrivate,
         files: {
            [fileName]: {
               content
            }
         }
      }

      const { data } = await axios.post('https://api.github.com/gists', payload, {
         headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
         }
      })

      let report = `╭───「 *UPLOAD SUCCESS* 」───
│
│ 📂 *File:* ${fileName}
│ 🔒 *Visibility:* ${isPrivate ? 'Private' : 'Public'}
│ 🔗 *Gist Link:* ${data.html_url}
│ 📄 *Raw Link:* ${data.files[fileName].raw_url}
│
╰────────────────────`

      m.reply(report)

   } catch (e) {
      console.error('UploadGits Error:', e)
      m.reply(`❌ *Gagal Mengunggah!*
Alasan: ${e.response?.data?.message || e.message}`)
   }
}

handler.help = ['uploadgits <filename> [--private]']
handler.tags = ['owner']
handler.command = ['uploadgits', 'togist', 'gists']
handler.owner = true

export default handler