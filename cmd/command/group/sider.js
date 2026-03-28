/**
 * @module command/group/ceksider
 * @description Detect silent readers (siders) in the group
 * @author Har (FRIEREN-MD)
 */

export default function(ev) {
    ev.on({
        name: 'ceksider',
        cmd: ['ceksider', 'sider', 'checkread', 'ghost'],
        tags: 'Group Menu',
        desc: 'Pantau member yang hanya menyimak (silent readers)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, usedPrefix, command }) => {
            // 1. Determine Duration
            let seconds = parseInt(args[0]) || 15
            if (seconds < 10) seconds = 10
            if (seconds > 60) seconds = 60
            const timeout = seconds * 1000

            // 2. Random Bait Messages
            const baits = [
                "🔍 *SCANNING SILENT READERS...*",
                "📸 *SMILE!* Sedang memotret para sider...",
                "📡 *RADAR AKTIF:* Mendeteksi member pasif...",
                "🎭 *SIDER DETECTION:* Siapa yang cuma nyimak?",
                "⚠️ *GHOST HUNTER:* Mencari penampakan member hantu..."
            ]
            const baitText = baits[Math.floor(Math.random() * baits.length)]

            const sentMsg = await xp.sendMessage(chat.id, { 
                text: `${baitText}\n\n_Bot akan mendata siapa yang membuka pesan ini dalam ${seconds} detik._\n_Jangan biarkan radar ini kosong!_` 
            }, { quoted: m })
            
            if (!sentMsg) return m.reply('❌ Gagal mengirim pesan pemancing.')

            const viewers = new Set()
            
            // 3. Setup Receipt Handler
            const receiptHandler = (updates) => {
                for (const update of updates) {
                    if (update.key.id === sentMsg.key.id) {
                        if (update.receipt && update.receipt.userJid) {
                             viewers.add(update.receipt.userJid)
                        }
                    }
                }
            }

            xp.ev.on('message-receipt.update', receiptHandler)

            // 4. Report Generation
            setTimeout(async () => {
                try {
                    xp.ev.off('message-receipt.update', receiptHandler)
                    
                    const groupMeta = await xp.groupMetadata(chat.id)
                    const totalMembers = groupMeta.participants.length
                    const botId = xp.user.id.split(':')[0] + '@s.whatsapp.net'
                    
                    // Filter viewers (exclude bot and those who were already active/ignored)
                    const results = [...viewers].filter(id => id !== botId)
                    
                    if (results.length === 0) {
                         await xp.sendMessage(chat.id, { 
                             text: `📉 *SCAN COMPLETE: NO DATA*\n\nTidak ada member yang terdeteksi membaca pesan ini dalam ${seconds} detik.\n\n_Mungkin mereka benar-benar sibuk, atau read-receipt mereka dimatikan._` 
                         }, { quoted: sentMsg })
                    } else {
                         const percentage = ((results.length / (totalMembers - 1)) * 100).toFixed(1)
                         let report = `📊 *SIDER SCAN REPORT* 📊\n`
                         report += `━━━━━━━━━━━━━━━━━━━━\n\n`
                         report += `🏢 *Grup:* ${groupMeta.subject}\n`
                         report += `🕒 *Durasi:* ${seconds} detik\n`
                         report += `👥 *Menyimak:* ${results.length} / ${totalMembers - 1} member\n`
                         report += `📈 *Keaktifan:* ${percentage}%\n\n`
                         report += `📝 *LIST PENYIMAK:*`
                         
                         const list = results.map((id, i) => `\n${i + 1}. @${id.split('@')[0]}`).join('')
                         report += list
                         report += `\n\n━━━━━━━━━━━━━━━━━━━━\n`
                         report += `_Hayo ketahuan cuma ngintip! Jangan jadi hantu ya!_ 👻`

                         await xp.sendMessage(chat.id, { 
                             text: report, 
                             mentions: results 
                         }, { quoted: sentMsg })
                    }
                } catch (e) {
                    console.error('Error report sider:', e)
                }
            }, timeout)
        }
    })
}
