export default function(ev) {
    ev.on({
        name: 'group_admin_actions',
        cmd: ['kick', 'add', 'promote', 'demote', 'delete', 'del', 'd'],
        tags: 'Group Menu',
        desc: 'Aksi moderasi grup (Kick, Add, Promote, Demote, Delete)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command, sender }) => {
            // --- Special Case: DELETE ---
            if (['delete', 'del', 'd'].includes(command)) {
                if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    return m.reply('❌ Reply pesan yang ingin dihapus!')
                }
                
                try {
                    const quoted = m.message.extendedTextMessage.contextInfo
                    const key = {
                        remoteJid: chat.id,
                        fromMe: quoted.participant === xp.user.id.split(':')[0] + '@s.whatsapp.net',
                        id: quoted.stanzaId,
                        participant: quoted.participant
                    }
                    
                    await xp.sendMessage(chat.id, { delete: key })
                    await xp.sendMessage(chat.id, { react: { text: '🗑️', key: m.key } })
                } catch (e) {
                    console.error('Delete Error:', e)
                    m.reply('❌ Gagal menghapus pesan. Pastikan Bot adalah Admin.')
                }
                return
            }

            // --- Helper: Extract Targets Robustly (Multiple Support) ---
            const getTargets = () => {
                let targets = []
                
                // 1. From Mentions
                const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                if (mentioned.length > 0) targets.push(...mentioned)

                // 2. From Quote
                const quoted = m.message?.extendedTextMessage?.contextInfo?.participant
                if (quoted) targets.push(quoted)

                // 3. From Args (Phone Numbers)
                if (args.length > 0) {
                    args.forEach(arg => {
                        let num = arg.replace(/[^0-9]/g, '')
                        if (num.length >= 10) { // Valid phone number length
                            targets.push(num + '@s.whatsapp.net')
                        }
                    })
                }

                // Remove duplicates and bot/sender
                const botId = xp.user.id.split(':')[0] + '@s.whatsapp.net'
                const senderId = sender.split(':')[0] + '@s.whatsapp.net'
                
                return [...new Set(targets)].filter(t => t !== botId && t !== senderId)
            }

            const targets = getTargets()
            if (targets.length === 0) return m.reply(`❌ Harap tag user, reply pesan, atau masukkan nomor-nomornya.\nContoh: .${command} @user1 @user2 628xxx`)
            
            try {
                switch (command) {
                    case 'kick': {
                        const target = targets[0]
                        const groupMeta = await xp.groupMetadata(chat.id);
                        
                        const targetUser = groupMeta.participants.find(p => 
                            p.id === target || 
                            p.id.split('@')[0].split(':')[0] === target.split('@')[0].split(':')[0]
                        );
                        
                        if (!targetUser) return m.reply('❌ User tersebut tidak ada di dalam grup.');
                        if (targetUser.admin === 'admin' || targetUser.admin === 'superadmin') return m.reply('❌ Gagal! Tidak bisa mengeluarkan admin.');

                        await xp.groupParticipantsUpdate(chat.id, [targetUser.id], 'remove');
                        await m.reply(`👋 Berhasil mengeluarkan @${target.split('@')[0]}`, { mentions: [target] });
                        break;
                    }

                    case 'add': {
                        const groupData = await xp.groupMetadata(chat.id);
                        const results = await xp.groupParticipantsUpdate(chat.id, targets, 'add')
                        
                        let success = [], privacy = [], failed = []
                        
                        results.forEach((res, i) => {
                            const jid = targets[i]
                            const status = res.status
                            if (status === '200') success.push(jid)
                            else if (status === '403') privacy.push(jid)
                            else failed.push(jid)
                        })

                        let response = '📊 *HASIL PENAMBAHAN ANGGOTA*\n\n'
                        if (success.length > 0) response += `✅ *Berhasil:* ${success.length} orang\n`
                        if (privacy.length > 0) response += `⚠️ *Privasi:* ${privacy.length} orang (Link undangan dikirim)\n`
                        if (failed.length > 0) response += `❌ *Gagal:* ${failed.length} orang\n`

                        // Handle Privacy (Send invites automatically if possible)
                        if (privacy.length > 0) {
                            const code = await xp.groupInviteCode(chat.id)
                            const groupName = groupData.subject
                            const inviteTxt = `Halo! Admin mengundang Anda bergabung ke grup *${groupName}*.\n\nLink: https://chat.whatsapp.com/${code}`
                            for (let pJid of privacy) {
                                await xp.sendMessage(pJid, { text: inviteTxt }).catch(() => {})
                            }
                        }

                        await m.reply(response.trim(), { mentions: [...success, ...privacy, ...failed] })
                        break
                    }

                    case 'promote': {
                        await xp.groupParticipantsUpdate(chat.id, targets, 'promote');
                        await m.reply(`👑 Selamat! ${targets.length} user sekarang adalah Admin.`, { mentions: targets });
                        break;
                    }

                    case 'demote': {
                        await xp.groupParticipantsUpdate(chat.id, targets, 'demote');
                        await m.reply(`⬇️ Jabatan Admin ${targets.length} user telah dicabut.`, { mentions: targets });
                        break;
                    }
                }
            } catch (e) {
                console.error(`[GROUP ADMIN ERROR] Command: ${command}, Error:`, e)
                const errStr = String(e)
                if (errStr.includes('403') || errStr.includes('forbidden')) {
                     m.reply('❌ Gagal! Pastikan Bot adalah Admin Grup.')
                } else if (errStr.includes('not-authorized')) {
                     m.reply('❌ Gagal: Target memiliki privasi ketat atau bot diblokir.')
                } else if (errStr.includes('item-not-found')) {
                     m.reply('❌ Gagal: Grup atau target tidak valid.')
                } else {
                     m.reply(`❌ Terjadi kesalahan saat memproses perintah.\nError: ${e.message || 'Unknown'}`)
                }
            }
        }
    })

    ev.on({
        name: 'group_request_action',
        cmd: ['approve', 'acc', 'reject'],
        tags: 'Group Menu',
        desc: 'Terima/Tolak permintaan bergabung (pending participants)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, command, chat }) => {
            try {
                // Fetch list permintaan
                const requestList = await xp.groupRequestParticipantsList(chat.id)
                
                if (!requestList || requestList.length === 0) {
                    return m.reply('✅ Tidak ada permintaan bergabung yang tertunda saat ini.')
                }

                // Tentukan aksi berdasarkan command
                const action = (command === 'reject' || command === 'tolak') ? 'reject' : 'approve'
                const actionText = action === 'approve' ? 'diterima' : 'ditolak'

                // Mode 1: Approve/Reject All
                if (args[0]?.toLowerCase() === 'all') {
                    const participants = requestList.map(req => req.jid)
                    await xp.groupRequestParticipantsUpdate(chat.id, participants, action)
                    return m.reply(`✅ Berhasil ${actionText} semua permintaan (${participants.length} orang).`)
                }

                // Mode 2: Specific Number
                const targetInput = args[0] ? args[0].replace(/[^0-9]/g, '') : null
                
                if (targetInput) {
                    const targetJid = targetInput + '@s.whatsapp.net'
                    // Validasi apakah target ada di list
                    const exists = requestList.find(req => req.jid === targetJid)
                    if (!exists) return m.reply('❌ Nomor tersebut tidak ada dalam daftar permintaan.')

                    await xp.groupRequestParticipantsUpdate(chat.id, [targetJid], action)
                    return m.reply(`✅ Berhasil ${actionText} @${targetInput}`, { mentions: [targetJid] })
                }

                // Mode 3: List Pending (Jika tanpa args)
                let txt = `📋 *DAFTAR PERMINTAAN BERGABUNG*\n`
                txt += `Total: ${requestList.length} orang\n\n`
                
                txt += requestList.map((req, i) => {
                    // requestTime biasanya unix timestamp (seconds)
                    const date = new Date(req.requestTime * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                    return `${i + 1}. @${req.jid.split('@')[0]}\n   📅 ${date}`
                }).join('\n\n')
                
                txt += `\n\n*Cara Penggunaan:*`
                txt += `\n• *.${command} all* (Proses semua)`
                txt += `\n• *.${command} 628xxx* (Proses nomor tertentu)`
                
                // Kirim list
                m.reply(txt, { mentions: requestList.map(r => r.jid) })

            } catch (e) {
                console.error(`[GROUP REQUEST ERROR] Command: ${command}, Error:`, e)
                m.reply('❌ Gagal memproses. Pastikan fitur "Approve New Participants" aktif di grup ini dan Bot adalah Admin.')
            }
        }
    })

    // --- KICK ALL (CLEAN GROUP) ---
    ev.on({
        name: 'kickall',
        cmd: ['kickall', 'cleargroup', 'kickclean'],
        tags: 'Group Menu',
        desc: 'Kick semua member (kecuali admin/owner). KHUSUS OWNER.',
        group: true,
        admin: true,
        prefix: true,
        owner: true,
        run: async (xp, m, { args, chat }) => {
            try {
                const step = args[0]?.toLowerCase()

                // 1. Initial Request
                if (!step) {
                    return m.reply(`⚠️ *PERINGATAN KERAS* ⚠️\n\nAnda akan mengeluarkan SEMUA member (non-admin) dari grup ini.\n\nKetik *.kickall y* untuk melanjutkan ke konfirmasi tahap 2.`)
                }

                // 2. First Confirmation
                if (step === 'y') {
                    return m.reply(`🛑 *KONFIRMASI TERAKHIR* 🛑\n\nApakah Anda benar-benar yakin? Aksi ini tidak dapat dibatalkan.\n\nKetik *.kickall sure* untuk mengeksekusi sekarang.`)
                }

                // 3. Final Execution
                if (step === 'sure') {
                    const meta = await xp.groupMetadata(chat.id)
                    const participants = meta.participants
                    const botId = xp.user.id.split(':')[0]
                    const ownerIds = (global.ownerNumber || []).map(n => n.replace(/\D/g, ''))
                    
                    // Filter targets
                    const targets = participants
                        .filter(p => {
                            const id = p.id.split(':')[0]
                            const isSender = id === m.sender.split('@')[0]
                            const isOwner = ownerIds.includes(id)
                            const isAdmin = p.admin !== null 
                            
                            return id !== botId && !isOwner && !isSender && !isAdmin 
                        })
                        .map(p => p.id)

                    if (targets.length === 0) return m.reply('✅ Tidak ada member biasa yang bisa di-kick.')

                    await m.reply(`🚀 Memulai pembersihan... (${targets.length} anggota)`)

                    // Execute
                    await xp.groupParticipantsUpdate(chat.id, targets, 'remove')
                    
                    return m.reply('✅ *SUKSES KICK ALL*')
                }

                // 4. Invalid Step
                return m.reply('❌ Perintah tidak dikenali. Ketik *.kickall* untuk memulai.')

            } catch (e) {
                console.error('Kickall Error:', e)
                m.reply('❌ Gagal melakukan kickall. Pastikan bot adalah Admin.')
            }
        }
    })

    // --- INVITE / UNDANG (SMART UI & RANDOM STYLES) ---
    ev.on({
        name: 'invite',
        cmd: ['invite', 'undang'],
        tags: 'Group Menu',
        desc: 'Mengundang user (Format: .invite @tag Pesan Bebas)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat }) => {
            // 1. Identify Target & Message
            let targets = []
            let customMessage = ''

            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            
            // Logic: If arg[0] is target, the rest is message
            // If mentioned exists, message is all args (cleaned of mentions)
            
            if (mentioned.length > 0) {
                targets = mentioned
                customMessage = args.filter(a => !a.startsWith('@')).join(' ')
            } else if (args[0] && (args[0].startsWith('0') || args[0].startsWith('62'))) {
                let num = args[0].replace(/[^0-9]/g, '')
                if (num.length >= 10) targets.push(num + '@s.whatsapp.net')
                customMessage = args.slice(1).join(' ')
            } else if (m.quoted) {
                targets.push(m.quoted.sender)
                customMessage = args.join(' ')
            }

            const botId = xp.user.id.split(':')[0] + '@s.whatsapp.net'
            targets = [...new Set(targets)].filter(t => t !== botId)

            if (targets.length === 0) return m.reply(`❌ Target tidak ditemukan.\nTag user, masukkan nomor, atau reply pesan mereka.\nContoh: .invite @Budi Ayo masuk!`)

            try {
                const code = await xp.groupInviteCode(chat.id)
                const meta = await xp.groupMetadata(chat.id)
                const link = `https://chat.whatsapp.com/${code}`
                const ppUrl = await xp.profilePictureUrl(chat.id, 'image').catch(() => 'https://telegra.ph/file/241d7180c0fa827916b44.jpg')
                const groupName = meta.subject
                const memberCount = meta.participants.length

                // --- SINGLE STYLE: AESTHETIC INVITATION ---
                const msgBody = ` 💌  𝐈 𝐍 𝐕 𝐈 𝐓 𝐀 𝐓 𝐈 𝐎 𝐍  𝐋 𝐄 𝐓 𝐓 𝐄 𝐑

 ❲ 👤 ❳  To : @${targets[0].split('@')[0]}
 ❲ 🏢 ❳  From : Group Admin

 You are cordially invited to join:
 ✦ ━━━━━━━━━━━━━━━━━ ✦
      ✨  ${groupName.toUpperCase()}  ✨
 ✦ ━━━━━━━━━━━━━━━━━ ✦

 💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞 :
 "${customMessage || 'We would be honored to have you.'}"

 📂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 :
 👥 ${memberCount} Members  |  🟢 Active
 ───────────────────────
 👇  𝐓𝐀𝐏 𝐁𝐄𝐋𝐎𝐖 𝐓𝐎 𝐉𝐎𝐈𝐍  👇
 ${link}`

                await m.reply(`📨 Mengirim undangan ke ${targets.length} orang...`)

                for (const target of targets) {
                    await xp.sendMessage(target, { 
                        image: { url: ppUrl },
                        caption: msgBody,
                        contextInfo: {
                            mentionedJid: [target],
                            externalAdReply: {
                                title: `🚀 JOIN ${groupName}`,
                                body: `Klik disini untuk bergabung`,
                                mediaType: 1,
                                thumbnailUrl: ppUrl,
                                sourceUrl: link,
                                renderLargerThumbnail: true
                            }
                        }
                    })
                    await new Promise(r => setTimeout(r, 2000))
                }

                m.reply('✅ Undangan terkirim.')

            } catch (e) {
                console.error('Invite Error:', e)
                m.reply('❌ Gagal. Pastikan Bot Admin.')
            }
        }
    })
}