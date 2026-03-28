import { requests, saveRequests } from '../../../system/db/data.js'
import { own } from '../../../system/helper.js'

export default function(ev) {
    ev.on({
        name: 'request',
        cmd: ['request', 'report'],
        tags: 'Tools Menu',
        desc: 'Request API, Fitur, Scrape, atau lapor Bug ke Developer',
        prefix: true,
        run: async (xp, m, { args, usedPrefix, command }) => {
            const isOwner = own(m)
            const categories = ['api', 'fitur', 'scrape', 'bug', 'dll']
            const sub = args[0]?.toLowerCase()
            
            // --- 1. OWNER ONLY: MANAGE REQUESTS ---
            if (isOwner && ['list', 'done', 'reject', 'acc'].includes(sub)) {
                const dbReq = requests().key || {}
                
                if (sub === 'list') {
                    const allReq = Object.values(dbReq)
                    if (allReq.length === 0) return m.reply('📭 Belum ada request masuk.')
                    
                    let txt = `📋 *DAFTAR REQUEST BOT* 📋\n\n`
                    allReq.forEach((r, i) => {
                        const status = r.status === 'done' ? '✅' : r.status === 'rejected' ? '❌' : '⏳'
                        txt += `${i + 1}. [${status}] *#${r.id}* - ${r.type.toUpperCase()}\n`
                        txt += `   👤 @${r.sender.split('@')[0]}\n`
                        txt += `   📝 "${r.message.slice(0, 30)}${r.message.length > 30 ? '...' : ''}"\n\n`
                    })
                    txt += `_Gunakan: ${usedPrefix + command} acc/done/reject <ID>_`
                    return m.reply(txt, { mentions: allReq.map(r => r.sender) })
                }

                const id = args[1]?.toUpperCase()
                if (!id || !dbReq[id]) return m.reply(`❌ Masukkan ID Request yang valid.`)

                if (sub === 'acc') {
                    dbReq[id].status = 'acc'
                    await saveRequests()
                    m.reply(`✅ Request *#${id}* telah diterima.`)
                    return xp.sendMessage(dbReq[id].jid, { text: `🔔 *UPDATE REQUEST # ${id}*\n\nRequest Anda: "${dbReq[id].message}"\nStatus: *DITERIMA / SEDANG DIKERJAKAN* ✅` })
                }

                if (sub === 'done') {
                    dbReq[id].status = 'done'
                    await saveRequests()
                    m.reply(`✅ Request *#${id}* ditandai SELESAI.`)
                    return xp.sendMessage(dbReq[id].jid, { text: `🔔 *UPDATE REQUEST # ${id}*\n\nRequest Anda: "${dbReq[id].message}"\nStatus: *SELESAI / UPDATE TERSEDIA* 🎊` })
                }

                if (sub === 'reject') {
                    const reason = args.slice(2).join(' ') || 'Tidak ada alasan spesifik.'
                    dbReq[id].status = 'rejected'
                    await saveRequests()
                    m.reply(`❌ Request *#${id}* ditolak.`)
                    return xp.sendMessage(dbReq[id].jid, { text: `🔔 *UPDATE REQUEST # ${id}*\n\nRequest Anda: "${dbReq[id].message}"\nStatus: *DITOLAK* ❌\nAlasan: ${reason}` })
                }
            }

            // --- 2. USER: CHECK STATUS ---
            if (sub === 'status' || sub === 'cek') {
                const id = args[1]?.toUpperCase()
                if (!id) return m.reply(`Gunakan: ${usedPrefix + command} status <ID>`)
                
                const dbReq = requests().key || {}
                const r = dbReq[id]
                if (!r) return m.reply('❌ ID Request tidak ditemukan.')

                const status = r.status === 'done' ? 'SELESAI ✅' : r.status === 'rejected' ? 'DITOLAK ❌' : r.status === 'acc' ? 'DITERIMA / PROSES ⏳' : 'MENUNGGU 🕒'
                
                let txt = `🔍 *DETAIL REQUEST # ${id}*\n\n`
                txt += `👤 *User:* @${r.sender.split('@')[0]}\n`
                txt += `🏷️ *Kategori:* ${r.type.toUpperCase()}\n`
                txt += `📝 *Pesan:* "${r.message}"\n`
                txt += `📊 *Status:* ${status}\n`
                txt += `📅 *Tanggal:* ${r.date}`
                
                return m.reply(txt, { mentions: [r.sender] })
            }

            // --- 3. USER: CREATE NEW REQUEST ---
            if (!sub || !categories.includes(sub)) {
                let txt = `💡 *REQUEST & REPORT SYSTEM* 💡\n\n`
                txt += `Kirim masukan, lapor bug, atau minta fitur baru langsung ke Developer.\n\n`
                txt += `*FORMAT:*\n`
                txt += `> \`${usedPrefix + command} <kategori> <pesan>\`\n\n`
                txt += `*KATEGORI:*\n`
                txt += categories.map(c => `• ${c.toUpperCase()}`).join('\n')
                txt += `\n\n*LAINNYA:*\n`
                txt += `• \`${usedPrefix + command} status <ID>\` (Cek status)\n`
                if (isOwner) txt += `• \`${usedPrefix + command} list\` (Owner Only)\n`
                
                txt += `\n*CONTOH:*\n`
                txt += `\`${usedPrefix + command} bug Bot tidak bisa download TikTok\``
                return m.reply(txt)
            }

            const message = args.slice(1).join(' ')
            if (!message || message.length < 10) {
                return m.reply('❌ Pesan terlalu pendek! Minimal 10 karakter agar jelas.')
            }

            const requestId = Math.random().toString(36).substring(2, 8).toUpperCase()
            const sender = m.sender
            const group = m.isGroup ? m.groupMetadata.subject : 'Private Chat'
            const date = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

            // Save to Database
            const dbReq = requests().key || {}
            dbReq[requestId] = {
                id: requestId,
                jid: sender,
                sender: m.sender,
                type: sub,
                message: message,
                group: group,
                status: 'pending',
                date: date
            }
            await saveRequests()

            // Format message for Owners
            const reportTxt = `📢 *NEW REQUEST / REPORT* 📢

🆔 *ID:* #${requestId}
👤 *Sender:* @${m.sender.split('@')[0]}
🏢 *Source:* ${group}
🏷️ *Type:* ${sub.toUpperCase()}

📝 *Message:*
"${message}"

📅 *Date:* ${date}
──────────────────
_Gunakan: ${usedPrefix + command} acc/done/reject ${requestId}_`

            try {
                // Send to all owners
                const owners = global.owner.map(o => o[0] + '@s.whatsapp.net')
                for (let ownerJid of owners) {
                    await xp.sendMessage(ownerJid, { 
                        text: reportTxt,
                        mentions: [m.sender]
                    })
                }

                // Response to user
                const userMsg = `✅ *REQUEST TERKIRIM!*

Terima kasih @${m.sender.split('@')[0]}, permintaan Anda telah tercatat.
🆔 *ID Request:* #${requestId}
📊 *Status:* MENUNGGU 🕒

_Gunakan \`${usedPrefix + command} status ${requestId}\` untuk cek update berkala._`
                
                await m.reply(userMsg, { mentions: [m.sender] })

            } catch (e) {
                console.error('Request Error:', e)
                m.reply('❌ Gagal mengirim request. Silakan coba lagi nanti.')
            }
        }
    })
}
