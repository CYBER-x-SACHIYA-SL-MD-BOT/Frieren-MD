/**
 * @module plugins/owner/deploy_vercel
 * @description Deploy static HTML or Framework projects (React, Next, etc) to Vercel instantly
 * @author Ported for FrierenBot
 */

import axios from 'axios'
import AdmZip from 'adm-zip'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// --- CONFIGURATION ---
// Dapatkan token di https://vercel.com/account/tokens
// Gunakan .setvercel <token> untuk menyimpan token
const getVercelToken = () => process.env.VERCEL_TOKEN || global.vercelToken || ''

let handler = async (m, { conn, text, args, usedPrefix, command, isOwner }) => {
    if (!isOwner) return

    const name = args[0]?.toLowerCase()
    if (!name) {
        return m.reply(
            `🚀 *𝐕𝐄𝐑𝐂𝐄𝐋 𝐃𝐄𝐏𝐋𝐎𝐘𝐄𝐑 (𝐏𝐑𝐎)*\n\n` +
            `Deploy project/framework Anda ke Vercel secara instan!\n\n` +
            `╭┈┈⬡「 📋 *𝐌𝐎𝐃𝐄 𝐃𝐄𝐏𝐋𝐎𝐘* 」\n` +
            `┃ 1️⃣ *Single Page:* Reply kode HTML.\n` +
            `┃ 2️⃣ *Project Folder:* Reply file .ZIP\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*𝐂𝐨𝐧𝐭𝐨𝐡:* ${usedPrefix + command} my-app`
        )
    }

    const VERCEL_TOKEN = getVercelToken()
    if (!VERCEL_TOKEN) return m.reply(`❌ Token Vercel belum diset!\n\nKetik: *${usedPrefix}setvercel <token_kamu>*`)

    if (!m.quoted) return m.reply("❌ Silakan reply kode HTML atau file project (.zip).")

    await conn.sendMessage(m.chat, { react: { text: '🚀', key: m.key } })

    let files = []
    let detectedFramework = null

    try {
        const q = m.quoted
        const mime = q.mimetype || q.msg?.mimetype || ''

        // --- MODE 1: ZIP FILE (PROJECT) ---
        if (mime === 'application/zip' || q.fileName?.endsWith('.zip') || q.mtype === 'documentMessage' && q.msg?.fileName?.endsWith('.zip')) {
            await m.reply("📦 *Project terdeteksi.* Mengekstrak dan menganalisis...")
            
            const buffer = await q.download()
            if (!buffer) throw new Error("Gagal mengunduh file ZIP.")
            
            const zip = new AdmZip(buffer)
            const entries = zip.getEntries()
            
            // Detect if all files are inside a single root folder
            let firstEntryParts = entries[0].entryName.split('/')
            let commonRoot = firstEntryParts.length > 1 ? firstEntryParts[0] : null
            
            if (commonRoot) {
                const allInRoot = entries.every(e => e.entryName.startsWith(commonRoot + '/'))
                if (!allInRoot) commonRoot = null
            }

            for (const entry of entries) {
                if (entry.isDirectory) continue
                
                let fileName = entry.entryName
                if (commonRoot) fileName = fileName.replace(commonRoot + '/', '')
                
                files.push({
                    file: fileName,
                    data: entry.getData().toString('base64'),
                    encoding: 'base64'
                })
            }

            if (files.length === 0) throw new Error("File ZIP kosong atau tidak terbaca.")
            
            // Framework Detection from extracted files
            const pkgEntry = entries.find(e => e.entryName.endsWith('package.json'))
            if (pkgEntry) {
                try {
                    const pkg = JSON.parse(pkgEntry.getData().toString('utf-8'))
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
                    if (deps['next']) detectedFramework = 'nextjs'
                    else if (deps['nuxt']) detectedFramework = 'nuxtjs'
                    else if (deps['vue']) detectedFramework = 'vue'
                    else if (deps['vite']) detectedFramework = 'vite'
                    else if (deps['react']) detectedFramework = 'create-react-app'
                    
                    if (detectedFramework) await m.reply(`⚙️ *Framework Terdeteksi:* ${detectedFramework.toUpperCase()}`)
                } catch (e) {}
            }
        } 
        // --- MODE 2: TEXT/HTML ---
        else {
            const htmlContent = q.text || q.caption || q.conversation || m.quoted.msg
            if (!htmlContent || typeof htmlContent !== 'string') throw new Error("Konten HTML tidak valid.")
            files = [{ file: 'index.html', data: Buffer.from(htmlContent).toString('base64'), encoding: 'base64' }]
        }

        const payload = {
            name: name,
            project: name,
            files: files,
            projectSettings: { framework: detectedFramework },
            target: 'production'
        }

        // Create Deployment
        const deployRes = await axios.post(
            'https://api.vercel.com/v13/deployments',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${VERCEL_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 300000 // 5 minutes
            }
        )

        const data = deployRes.data
        const url = `${name}.vercel.app`
        const projectId = data.projectId

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

        const successMsg = `🎉 *𝐃𝐄𝐏𝐋𝐎𝐘 𝐒𝐔𝐂𝐂𝐄𝐒𝐒* 🎉\n\n` +
            `🌐 *Project Name:* ${name}\n` +
            `🆔 *Project ID:* ${projectId}\n` +
            `⚙️ *Framework:* ${detectedFramework || 'Static'}\n` +
            `📄 *Files:* ${files.length} items\n\n` +
            `🔗 *URL:* https://${url}\n\n` +
            `_Note: Jika URL utama belum aktif, gunakan URL backup deployment ini: https://${data.url}_`

        await m.reply(successMsg)

    } catch (error) {
        console.error('[Vercel] Error:', error.response?.data || error.message)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        const errMsg = error.response?.data?.error?.message || error.message
        m.reply(`❌ *𝐃𝐄𝐏𝐋𝐎𝐘 𝐅𝐀𝐈𝐋𝐄𝐃*\n\nReason: ${errMsg}`)
    }
}

handler.help = ['deploy <name>']
handler.tags = ['owner']
handler.command = ['deploy', 'vercel']
handler.owner = true
handler.prefix = true

export default handler