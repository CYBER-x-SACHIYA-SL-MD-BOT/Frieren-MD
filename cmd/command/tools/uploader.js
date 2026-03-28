import axios from 'axios'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');
import { tmpFiles } from '../../../system/tmpfiles.js'
import { sendIAMessage } from '../../../system/function.js'

export default function(ev) {
    // --- TOURL (MULTI SERVER AUTO) ---
    ev.on({
        name: 'tourl',
        cmd: ['tourl', 'catbox', 'upload'],
        tags: 'Tools Menu',
        desc: 'Upload media ke berbagai server sekaligus',
        run: async (xp, m, { chat }) => {
          try {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
            const media = q?.imageMessage || q?.videoMessage || q?.audioMessage || q?.documentMessage
            
            if (!media) return m.reply('❌ Kirim/Reply media (Gambar/Video/Dokumen).')
    
            await xp.sendMessage(chat.id, { react: { text: '⬆️', key: m.key } })
            const buffer = await downloadMediaMessage({ message: q }, 'buffer')
            
            // Helper untuk upload Catbox
            const uploadCatbox = async (buf) => {
                try {
                    const fd = new FormData()
                    fd.append('reqtype', 'fileupload')
                    fd.append('fileToUpload', buf, { filename: 'file' })
                    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd })
                    const url = await res.text()
                    if (url && url.startsWith('http')) return url
                    throw new Error('Gagal')
                } catch (e) { return null }
            }
    
            // Helper untuk upload Uguu
            const uploadUguu = async (buf) => {
                try {
                    const fd = new FormData()
                    fd.append('files[]', buf, { filename: 'file.jpg' }) 
                    const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body: fd }).then(r => r.json())
                    if (res.success) return res.files[0].url
                    throw new Error('Gagal')
                } catch (e) { return null }
            }
    
            // Helper untuk upload Tmpfiles
            const uploadTmp = async (buf) => {
                try {
                    return await tmpFiles(buf)
                } catch (e) { return null }
            }
    
            // Helper untuk upload Termai CDN
            const uploadTermai = async (buf) => {
                try {
                    const { fileTypeFromBuffer } = await import('file-type')
                    const type = await fileTypeFromBuffer(buf)
                    const ext = type ? type.ext : 'bin'
                    
                    const fd = new FormData()
                    fd.append('file', buf, { filename: `file.${ext}` })
                    
                    const res = await axios.post('https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk', fd, {
                        headers: { ...fd.getHeaders() }
                    })
                    
                    return res.data?.path || null
                } catch (e) { return null }
            }
    
            // Helper untuk upload Telegra.ph
            const uploadTelegra = async (buf) => {
                try {
                    const { fileTypeFromBuffer } = await import('file-type')
                    const type = await fileTypeFromBuffer(buf)
                    const ext = type ? type.ext : 'jpg'
                    const mime = type ? type.mime : 'image/jpeg'
                    
                    const fd = new FormData()
                    fd.append('file', buf, { filename: `file.${ext}`, contentType: mime })
                    
                    const res = await axios.post('https://telegra.ph/upload', fd, {
                        headers: { ...fd.getHeaders() }
                    })
                    
                    if (res.data && res.data[0] && res.data[0].src) {
                        return 'https://telegra.ph' + res.data[0].src
                    }
                    throw new Error('Gagal')
                } catch (e) { return null }
            }

            // Helper untuk upload Deline
            const uploadDeline = async (buf) => {
                try {
                    const { fileTypeFromBuffer } = await import('file-type')
                    const type = await fileTypeFromBuffer(buf)
                    const ext = type ? type.ext : 'bin'
                    
                    const fd = new FormData()
                    fd.append('file', buf, { filename: `file.${ext}` })
                    
                    const res = await axios.post('https://api.deline.web.id/uploader', fd, {
                        headers: { ...fd.getHeaders() }
                    })
                    
                    // Adjust based on actual API response structure. 
                    // Usually { status: true, result: { url: ... } } or similar
                    return res.data?.result?.url || res.data?.url || null
                } catch (e) { return null }
            }
            // Helper untuk upload Qu.ax
            const uploadQuax = async (buf) => {
                try {
                    const { fileTypeFromBuffer } = await import('file-type')
                    const type = await fileTypeFromBuffer(buf)
                    const ext = type ? type.ext : 'jpg'
                    
                    const fd = new FormData()
                    fd.append('files[]', buf, { filename: `file.${ext}`, contentType: type?.mime }) 
                    
                    const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body: fd }).then(r => r.json())
                    if (res.success) return res.files[0].url
                    return null
                } catch (e) { return null }
            }

            // Helper untuk upload Put.icu
            const uploadPut = async (buf) => {
                try {
                    const { fileTypeFromBuffer } = await import('file-type')
                    const type = await fileTypeFromBuffer(buf)
                    const mime = type ? type.mime : 'application/octet-stream'
                    
                    const res = await fetch("https://put.icu/upload/", {
                        method: "PUT",
                        headers: { "Content-Type": mime, Accept: "application/json" },
                        body: buf
                    });
                    
                    const json = await res.json();
                    return json?.direct_url || null
                } catch (e) { return null }
            }
    
            // Eksekusi semua upload secara paralel
            const results = await Promise.all([
                uploadCatbox(buffer),
                uploadTelegra(buffer),
                uploadUguu(buffer),
                uploadTmp(buffer),
                uploadTermai(buffer),
                uploadDeline(buffer),
                uploadQuax(buffer),
                uploadPut(buffer)
            ])
    
            const [catbox, telegra, uguu, tmp, termai, deline, quax, put] = results
            const buttons = []
            let bodyTxt = `📤 *UPLOAD COMPLETED* 📤\n\n`
    
            if (deline) {
                bodyTxt += `✅ Deline\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "🌐 Copy Deline", copy_code: deline }) })
            }
            if (quax) {
                bodyTxt += `✅ Qu.ax\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "🦆 Copy Qu.ax", copy_code: quax }) })
            }
            if (put) {
                bodyTxt += `✅ Put.icu\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "💾 Copy Put.icu", copy_code: put }) })
            }
            if (catbox) {
                bodyTxt += `✅ Catbox\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📦 Copy Catbox", copy_code: catbox }) })
            }
            if (telegra) {
                bodyTxt += `✅ Telegra.ph\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📝 Copy Telegra", copy_code: telegra }) })
            }
            if (uguu) {
                bodyTxt += `✅ Uguu\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "👻 Copy Uguu", copy_code: uguu }) })
            }
            if (tmp) {
                bodyTxt += `✅ TmpFiles\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "⏳ Copy TmpFiles", copy_code: tmp }) })
            }
            if (termai) {
                bodyTxt += `✅ Termai\n`
                buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "☁️ Copy Termai", copy_code: termai }) })
            }
            
            if (buttons.length === 0) return m.reply('❌ Gagal upload ke semua server.')
    
            await sendIAMessage(xp, chat.id, buttons, {
                title: "MEDIA UPLOADER",
                body: bodyTxt,
                footer: global.botName
            }, { quoted: m })
    
          } catch (e) { 
              console.error(e)
              m.reply('❌ Gagal upload media.') 
          }
        }
    })
}