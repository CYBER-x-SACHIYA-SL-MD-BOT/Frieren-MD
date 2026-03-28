import { sendIAMessage, groupCache } from '../../../system/function.js'
import { getGc, saveGc } from '../../../system/db/data.js' // Added DB imports
import { createRequire } from "module";
import fetch from 'node-fetch'
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

export default function(ev) {
    // --- GROUP OPEN/CLOSE ---
    ev.on({
        name: 'group_setting_open_close',
        cmd: ['group', 'grup', 'opengc', 'closegc', 'bukagc', 'tutupgc'],
        tags: 'Group Menu',
        desc: 'Buka atau tutup grup (opengc/closegc)',
        group: true,
        admin: true,
        prefix: true,
        botAdmin: true,
        run: async (xp, m, { args, chat, command }) => {
            let mode = args[0]?.toLowerCase()
            
            if (command.includes('open') || command.includes('buka')) mode = 'open'
            if (command.includes('close') || command.includes('tutup')) mode = 'close'

            if (!mode || !['open', 'buka', 'close', 'tutup'].includes(mode)) {
                return m.reply(`❌ Format salah!\nGunakan: .group open atau .group close`)
            }

            const setting = (mode === 'open' || mode === 'buka') ? 'not_announcement' : 'announcement'
            
            try {
                await xp.groupSettingUpdate(chat.id, setting)
                const status = (setting === 'not_announcement') ? 'DIBUKA ✅' : 'DITUTUP ⛔'
                m.reply(`Grup berhasil *${status}*.\n${setting === 'not_announcement' ? 'Semua peserta dapat mengirim pesan.' : 'Hanya admin yang dapat mengirim pesan.'}`)
            } catch (e) {
                if (String(e).includes('not-authorized')) {
                    console.log(`[RETRY] Not Authorized in ${chat.id}, refreshing metadata...`)
                    groupCache.delete(chat.id) // Clear cache
                    await new Promise(r => setTimeout(r, 1500)) // Wait for sync
                    
                    try {
                        await xp.groupSettingUpdate(chat.id, setting)
                        const status = (setting === 'not_announcement') ? 'DIBUKA ✅' : 'DITUTUP ⛔'
                        m.reply(`✅ *RETRY SUCCESS*\nGrup berhasil *${status}* setelah sinkronisasi ulang.`)
                    } catch (e2) {
                        m.reply('❌ Gagal! Server WhatsApp menolak permintaan. Pastikan bot benar-benar Admin.')
                    }
                } else {
                    m.reply(`❌ Error: ${e.message}`)
                }
            }
        }
    })

    // --- LINK GROUP (Public/Member) ---
    ev.on({
        name: 'group_link',
        cmd: ['link', 'linkgc'],
        tags: 'Group Menu',
        desc: 'Ambil link grup',
        group: true,
        botAdmin: true,
        run: async (xp, m, { chat }) => {
            try {
                const code = await xp.groupInviteCode(chat.id)
                const link = `https://chat.whatsapp.com/${code}`
                
                const buttons = [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Salin Link",
                            copy_code: link,
                            id: "copy_link_gc"
                        })
                    },
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Buka Link",
                            url: link,
                            merchant_url: link
                        })
                    }
                ]

                await sendIAMessage(xp, chat.id, buttons, {
                    title: "Link Group",
                    body: "Berikut adalah link grup ini.",
                    footer: global.botName,
                    media: await xp.profilePictureUrl(chat.id, 'image').catch(() => null)
                }, { quoted: m })
            } catch (e) {
                m.reply('Gagal mengambil link. Pastikan bot adalah admin.')
            }
        }
    })

    // --- REVOKE LINK (Admin Only) ---
    ev.on({
        name: 'group_revoke',
        cmd: ['revoke', 'resetlink'],
        tags: 'Group Menu',
        desc: 'Reset link grup',
        group: true,
        admin: true,
        prefix: true,
        botAdmin: true,
        run: async (xp, m, { chat }) => {
            try {
                await xp.groupRevokeInvite(chat.id)
                m.reply('✅ Link grup berhasil direset (dicabut). Link lama tidak berlaku.')
            } catch (e) {
                m.reply('Gagal mereset link.')
            }
        }
    })

    // --- INFO EDIT SETTING (Lock/Unlock) ---
    ev.on({
        name: 'group_info_lock',
        cmd: ['locked', 'unlocked', 'lockinfo', 'unlockinfo'],
        tags: 'Group Menu',
        desc: 'Kunci/Buka izin edit info grup (Nama, Deskripsi, Icon)',
        group: true,
        admin: true,
        prefix: true,
        botAdmin: true,
        run: async (xp, m, { command, chat }) => {
            const isLock = ['locked', 'lockinfo'].includes(command)
            const setting = isLock ? 'locked' : 'unlocked'

            await xp.groupSettingUpdate(chat.id, setting)
            m.reply(isLock 
                ? '🔒 *INFO GRUP DIKUNCI*\nHanya admin yang dapat mengubah info grup.' 
                : '🔓 *INFO GRUP DIBUKA*\nSemua anggota dapat mengubah info grup.'
            )
        }
    })

    // --- GROUP METADATA (Name, Desc, PP) ---
    ev.on({
        name: 'group_metadata_edit',
        cmd: ['setname', 'setdesc', 'setpp', 'setppgroup', 'setppgc'],
        tags: 'Group Menu',
        desc: 'Ubah Nama, Deskripsi, atau Foto Profil Grup',
        group: true,
        admin: true,
        prefix: true,
        botAdmin: true,
        run: async (xp, m, { args, chat, command }) => {
            const text = args.join(' ')

            switch (command) {
                case 'setname': {
                    if (!text) return m.reply('❌ Masukkan nama baru grup.')
                    try {
                        await xp.groupUpdateSubject(chat.id, text)
                        m.reply(`✅ Nama grup berhasil diubah menjadi:\n*${text}*`)
                    } catch (e) {
                        console.error(e)
                        m.reply('❌ Gagal mengubah nama grup. Pastikan nama tidak terlalu panjang (max 25 chars).')
                    }
                    break
                }

                case 'setdesc': {
                    if (!text) return m.reply('❌ Masukkan deskripsi baru.')
                    try {
                        await xp.groupUpdateDescription(chat.id, text)
                        m.reply('✅ Deskripsi grup berhasil diperbarui.')
                    } catch (e) {
                        console.error(e)
                        m.reply('❌ Gagal mengubah deskripsi grup.')
                    }
                    break
                }

                case 'setpp':
                case 'setppgroup':
                case 'setppgc': {
                    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                    const message = m.message?.ephemeralMessage?.message || m.message || {}
                    const content = quoted || message
                    
                    const image = content.imageMessage || 
                                  content.viewOnceMessage?.message?.imageMessage || 
                                  content.viewOnceMessageV2?.message?.imageMessage

                    if (!image) {
                         return m.reply('❌ Kirim atau Reply gambar dengan caption .setpp')
                    }

                    try {
                        const media = await downloadMediaMessage({ message: content }, 'buffer')
                        await xp.updateProfilePicture(chat.id, media)
                        m.reply('✅ Foto profil grup berhasil diperbarui.')
                    } catch (e) {
                        console.error('Error setpp:', e)
                        m.reply('❌ Gagal mengubah foto profil. Pastikan gambar valid dan bot adalah admin.')
                    }
                    break
                }
            }
        }
    })
    
    // --- EPHEMERAL SETTING (Pesan Sementara) ---
    ev.on({
        name: 'group_ephemeral',
        cmd: ['ephemeral', 'fading'],
        tags: 'Group Menu',
        desc: 'Atur pesan sementara (hilang otomatis)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat }) => {
            const opt = args[0]?.toLowerCase()
            // 24H = 86400, 7D = 604800, 90D = 7776000, OFF = 0
            if (!opt) return m.reply('❌ Pilih opsi: off, 24h, 7d, 90d')

            let duration = 0
            switch (opt) {
                case '24h': duration = 86400; break
                case '7d': duration = 604800; break
                case '90d': duration = 7776000; break
                case 'off': duration = 0; break
                default: return m.reply('❌ Opsi tidak valid. Gunakan: off, 24h, 7d, 90d')
            }

            await xp.sendMessage(chat.id, { disappearingMessagesInChat: duration })
            m.reply(`✅ Pesan sementara diset ke: *${opt.toUpperCase()}*`)
        }
    })

        // --- TOGGLE FITUR GROUP (PER-GROUP DISABLE) ---
        ev.on({
            name: 'group_feature_toggle',
            cmd: ['fitur', 'turn', 'switch', 'blockcmd'],
            tags: 'Group Menu',
            desc: 'Matikan/Hidupkan fitur tertentu di grup ini',
            group: true,
            admin: true,
        prefix: true,
            run: async (xp, m, { args, chat, usedPrefix, command }) => {
                const feature = args[0]?.toLowerCase()
                const action = args[1]?.toLowerCase()
                if (!feature || !action) {
                    return m.reply(`🛠️ *ATUR FITUR GRUP*
                    
    Matikan/Hidupkan fitur spesifik hanya di grup ini.
    Format: ${usedPrefix + command} <nama/tag> <on/off>
    Contoh: 
    • ${usedPrefix + command} rpg off (Matikan RPG)
    • ${usedPrefix + command} simi off (Matikan Simi)
    • ${usedPrefix + command} sticker on (Hidupkan Sticker)
    _Note: Gunakan nama command atau kategori_`)
                }
            if (!['on', 'off'].includes(action)) return m.reply('❌ Pilih action: on atau off')
            const gcData = getGc(chat.id)
            if (!gcData) return m.reply('❌ Database grup belum siap.')
            // Initialize disabled list if not exists
            gcData.filter = gcData.filter || {}
            gcData.filter.disabled = gcData.filter.disabled || []
            // Handle OFF (Disable)
            if (action === 'off') {
                if (gcData.filter.disabled.includes(feature)) {
                    return m.reply(`⚠️ Fitur *${feature}* sudah dimatikan di grup ini.`)
                }
                gcData.filter.disabled.push(feature)
                saveGc()
                return m.reply(`⛔ Fitur *${feature}* berhasil dimatikan untuk grup ini.`)
            }

            // Handle ON (Enable)
            if (action === 'on') {
                if (!gcData.filter.disabled.includes(feature)) {
                    return m.reply(`⚠️ Fitur *${feature}* sudah aktif.`)
                }
                gcData.filter.disabled = gcData.filter.disabled.filter(f => f !== feature)
                saveGc()
                return m.reply(`✅ Fitur *${feature}* berhasil diaktifkan kembali.`)
            }
        }
    })

    // --- AUTO GROUP LOCK JADWAL ---
    ev.on({
        name: 'setgclock',
        cmd: ['setgclock', 'jadwalgrup', 'gclock'],
        tags: 'Group Menu',
        desc: 'Atur jam tutup dan buka grup otomatis (Format HH:mm)',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat }) => {
            const gcData = getGc(chat.id)
            
            if (args[0]?.toLowerCase() === 'off' || args[0]?.toLowerCase() === 'reset') {
                delete gcData.staySchedule
                saveGc()
                return m.reply('✅ Jadwal operasional grup telah dinonaktifkan.')
            }

            const close = args[0] // Jam Tutup
            const open = args[1]  // Jam Buka

            if (!close || !open || !close.includes(':') || !open.includes(':')) {
                return m.reply(`🛠️ *SET GROUP OPERATIONAL HOURS*
                
Format: .setgclock <jam_tutup> <jam_buka>
Contoh: .setgclock 22:00 05:00

Untuk mematikan: .setgclock off`)
            }

            gcData.staySchedule = { close, open }
            saveGc()

            m.reply(`✅ *Jadwal Grup Berhasil Diset!*
            
🌙 Jam Tutup: ${close}
☀️ Jam Buka: ${open}

_Bot akan menutup grup secara otomatis di jam tersebut._`)
        }
    })

    ev.on({
        name: 'delgclock',
        cmd: ['delgclock', 'resetgclock'],
        tags: 'Group Menu',
        desc: 'Hapus jadwal tutup/buka grup',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { chat }) => {
            const gcData = getGc(chat.id)
            delete gcData.staySchedule
            saveGc()
            m.reply('✅ Jadwal operasional grup telah dihapus.')
        }
    })
}