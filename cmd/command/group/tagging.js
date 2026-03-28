import { db } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'group_tagging',
        cmd: ['tagall', 'hidetag', 'all'],
        tags: 'Group Menu',
        desc: 'Mention semua anggota grup',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command, participants }) => {
            const membersId = participants.map(p => p.id)
            const text = args.join(' ')
            
            // --- HIDETAG ---
            if (command === 'hidetag') {
                const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                
                // Case 1: Reply to Media/Msg
                if (quoted) {
                    const type = Object.keys(quoted)[0]
                    // If media (image/video)
                    if (['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage'].includes(type)) {
                         const content = await xp.downloadMediaMessage({ message: quoted }, 'buffer').catch(() => null)
                         if (content) {
                             // Re-send media with mentions
                             await xp.sendMessage(chat.id, { 
                                 [type.replace('Message', '')]: content, 
                                 caption: text, 
                                 mentions: membersId 
                             })
                             return
                         }
                    }
                    // If text reply
                    const replyText = quoted.conversation || quoted.extendedTextMessage?.text || text || 'Halo!'
                    await xp.sendMessage(chat.id, { text: replyText, mentions: membersId })
                } else {
                    // Case 2: Standard text hidetag
                    const msg = text || 'Halo semua!'
                    await xp.sendMessage(chat.id, { text: msg, mentions: membersId })
                }
                return
            }

            // --- TAGALL ---
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            const members = participants.filter(p => !p.admin)
            
            let txt = `╔═══「 *MENTION ALL* 」═══\n`
            txt += `╠ 📝 *Pesan:* ${text || 'N/A'}\n`
            txt += `╠ 👥 *Total:* ${participants.length} Member\n`
            
            if (admins.length > 0) {
                txt += `╠\n╠ 👑 *ADMINS (${admins.length})*\n`
                for (let admin of admins) {
                    txt += `╠ ➥ @${admin.id.split('@')[0]}\n`
                }
            }
            
            if (members.length > 0) {
                txt += `╠\n╠ 👤 *MEMBERS (${members.length})*\n`
                for (let member of members) {
                    txt += `╠ ➥ @${member.id.split('@')[0]}\n`
                }
            }

            txt += `╠\n╚═══「 ${global.botName || 'Bot'} 」═══`
            
            await xp.sendMessage(chat.id, { text: txt, mentions: membersId }, { quoted: m })
        }
    })
}