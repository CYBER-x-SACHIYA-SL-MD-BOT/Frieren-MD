import { getGc, saveGc } from '../../../system/db/data.js'

export default function(ev) {
    // --- GENERAL SECURITY TOGGLES (Antilink, etc.) ---
    ev.on({
        name: 'group_security_toggles',
        cmd: ['antilink', 'antilinkgc', 'antivirus', 'antishortlink', 'antisticker', 'antitoxic', 'antibot', 'antipromote', 'antidemote', 'antiwame'],
        tags: 'Group Menu',
        desc: 'Aktifkan/Nonaktifkan fitur keamanan grup',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command }) => {
            const gcData = getGc(chat.id)
            if (!gcData) return m.reply('❌ Database grup belum siap. Ketik pesan apapun untuk inisialisasi.')

            // Ensure filter object exists
            gcData.filter = gcData.filter || {}

            const opt = args[0]?.toLowerCase()
            if (!opt || !['on', 'off'].includes(opt)) {
                const current = gcData.filter[command] ? 'ON ✅' : 'OFF ⛔'
                return m.reply(`🛡️ *${command.toUpperCase()}* saat ini: ${current}\n\nCara pakai: .${command} on/off`)
            }

            const enable = opt === 'on'
            gcData.filter[command] = enable
            saveGc()

            m.reply(`✅ Fitur *${command.toUpperCase()}* berhasil diubah menjadi: *${enable ? 'ON' : 'OFF'}*`)
        }
    })

    // --- BLACKLIST USER ---
    ev.on({
        name: 'group_blacklist',
        cmd: ['blacklist', 'unblacklist', 'listblacklist'],
        tags: 'Group Menu',
        desc: 'Blacklist member agar auto-kick jika masuk',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command }) => {
            const gcData = getGc(chat.id)
            if (!gcData) return 

            gcData.blacklist = gcData.blacklist || []

            // LIST
            if (command === 'listblacklist') {
                if (gcData.blacklist.length === 0) return m.reply('📋 Daftar blacklist kosong.')
                const list = gcData.blacklist.map((id, i) => `${i+1}. @${id.split('@')[0]}`).join('\n')
                return m.reply(`⛔ *DAFTAR BLACKLIST*\n\n${list}`, { mentions: gcData.blacklist })
            }

            // TARGET EXTRACTION
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant
            const target = mentioned || quoted || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

            if (!target) return m.reply('❌ Tag user, reply pesan, atau masukkan nomor yang valid.')

            // EXECUTE
            if (command === 'blacklist') {
                if (gcData.blacklist.includes(target)) return m.reply('⚠️ User sudah ada di blacklist.')
                
                gcData.blacklist.push(target)
                saveGc()
                
                // Try kick immediately
                try {
                    await xp.groupParticipantsUpdate(chat.id, [target], 'remove')
                    m.reply(`⛔ @${target.split('@')[0]} telah di-blacklist dan dikeluarkan.`, { mentions: [target] })
                } catch {
                    m.reply(`⛔ @${target.split('@')[0]} telah di-blacklist (User tidak di dalam grup saat ini).`, { mentions: [target] })
                }

            } else { // unblacklist
                if (!gcData.blacklist.includes(target)) return m.reply('⚠️ User tidak ada di blacklist.')
                
                gcData.blacklist = gcData.blacklist.filter(id => id !== target)
                saveGc()
                m.reply(`✅ @${target.split('@')[0]} dihapus dari blacklist.`, { mentions: [target] })
            }
        }
    })

    // --- BLOCK COMMAND (BANCMD) ---
    ev.on({
        name: 'group_bancmd',
        cmd: ['bancmd', 'unbancmd', 'listbancmd'],
        tags: 'Group Menu',
        desc: 'Blokir command tertentu agar tidak bisa dipakai di grup',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command }) => {
            const gcData = getGc(chat.id)
            
            gcData.cmdBlocked = gcData.cmdBlocked || []

            if (command === 'listbancmd') {
                if (gcData.cmdBlocked.length === 0) return m.reply('✅ Tidak ada command yang diblokir.')
                return m.reply(`⛔ *BLOCKED COMMANDS*\n\n${gcData.cmdBlocked.map(c => `• .${c}`).join('\n')}`)
            }

            const cmdTarget = args[0]?.toLowerCase()
            if (!cmdTarget) return m.reply(`❌ Masukkan nama command!\nContoh: .${command} stiker`)

            if (command === 'bancmd') {
                if (gcData.cmdBlocked.includes(cmdTarget)) return m.reply('⚠️ Command sudah diblokir sebelumnya.')
                gcData.cmdBlocked.push(cmdTarget)
                m.reply(`⛔ Command *${cmdTarget}* sekarang tidak bisa digunakan di grup ini.`)
            } else { // unbancmd
                if (!gcData.cmdBlocked.includes(cmdTarget)) return m.reply('⚠️ Command tidak sedang diblokir.')
                gcData.cmdBlocked = gcData.cmdBlocked.filter(c => c !== cmdTarget)
                m.reply(`✅ Command *${cmdTarget}* sekarang bisa digunakan kembali.`)
            }
            saveGc()
        }
    })

    // --- MUTE USER (SHUT UP) ---
    ev.on({
        name: 'group_mute',
        cmd: ['muteuser', 'unmuteuser', 'listmute'],
        tags: 'Group Menu',
        desc: 'Mute user tertentu agar tidak bisa kirim pesan (Bot akan menghapus pesannya)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command }) => {
            const gcData = getGc(chat.id)
            if (!gcData) return 

            gcData.muteList = gcData.muteList || []

            // LIST
            if (command === 'listmute') {
                if (gcData.muteList.length === 0) return m.reply('✅ Tidak ada user yang di-mute.')
                const list = gcData.muteList.map((id, i) => `${i+1}. @${id.split('@')[0]}`).join('\n')
                return m.reply(`😶 *DAFTAR MUTE USER*\n\n${list}`, { mentions: gcData.muteList })
            }

            // TARGET EXTRACTION
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant
            const target = mentioned || quoted || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

            if (!target) return m.reply('❌ Tag user, reply pesan, atau masukkan nomor!\nContoh: .muteuser @user')
            
            // Prevent Muting Bot or Owner
            const botId = xp.user.id.split(':')[0]
            if (target.includes(botId)) return m.reply('❌ Tidak bisa mute bot.')
            if (global.ownerNumber.includes(target.split('@')[0])) return m.reply('❌ Tidak bisa mute owner.')

            if (command === 'muteuser') {
                if (gcData.muteList.includes(target)) return m.reply('⚠️ User sudah di-mute sebelumnya.')
                
                gcData.muteList.push(target)
                saveGc()
                m.reply(`😶 @${target.split('@')[0]} berhasil di-mute. Bot akan menghapus pesannya jika dia chat.`, { mentions: [target] })
                
            } else { // unmute
                if (!gcData.muteList.includes(target)) return m.reply('⚠️ User tidak sedang di-mute.')
                
                gcData.muteList = gcData.muteList.filter(id => id !== target)
                saveGc()
                m.reply(`✅ @${target.split('@')[0]} telah di-unmute.`, { mentions: [target] })
            }
        }
    })
}
