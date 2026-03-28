export default function(ev) {

    // --- GET PRIVACY SETTINGS ---
    ev.on({
        name: 'privacy_get',
        cmd: ['getprivacy', 'privacysettings', 'cekprivasi'],
        tags: 'Privacy Menu',
        desc: 'Lihat pengaturan privasi akun bot',
        owner: true,
        run: async (xp, m) => {
            if (typeof xp.fetchPrivacySettings !== 'function') {
                return m.reply('❌ Fitur fetchPrivacySettings tidak didukung oleh library ini.')
            }

            try {
                await xp.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
                
                const privacy = await xp.fetchPrivacySettings(true) || {}
                
                let txt = `🔐 *PENGATURAN PRIVASI BOT*\n\n`
                txt += `👀 *Last Seen:* ${privacy.last || 'Tidak diketahui'}\n`
                txt += `🌐 *Online:* ${privacy.online || 'Tidak diketahui'}\n`
                txt += `🖼️ *Profile Pict:* ${privacy.profile || 'Tidak diketahui'}\n`
                txt += `📝 *Status (About):* ${privacy.status || 'Tidak diketahui'}\n`
                txt += `✅ *Read Receipts:* ${privacy.readreceipts || 'Tidak diketahui'}\n`
                txt += `👥 *Group Add:* ${privacy.groupadd || 'Tidak diketahui'}\n`
                txt += `⏳ *Default Timer:* ${privacy.defaultDisappearingMode?.duration ? privacy.defaultDisappearingMode.duration + 's' : 'Off'}\n`

                await xp.sendMessage(m.chat, { text: txt }, { quoted: m })

            } catch (e) {
                console.error('Get Privacy Error:', e)
                m.reply('❌ Gagal mengambil data privasi. Mungkin server sedang sibuk.')
            }
        }
    })

    // --- SET LAST SEEN ---
    ev.on({
        name: 'privacy_last_seen',
        cmd: ['setlastseen', 'lastseen'],
        tags: 'Privacy Menu',
        desc: 'Atur privasi Last Seen (all/contacts/none)',
        owner: true,
        run: async (xp, m, { args }) => {
            if (typeof xp.updateLastSeenPrivacy !== 'function') return m.reply('❌ Fitur tidak didukung oleh library.')

            const val = args[0]?.toLowerCase()
            if (!val || !['all', 'contacts', 'none', 'contact_blacklist'].includes(val)) {
                return m.reply('❌ Opsi: all, contacts, none, contact_blacklist')
            }
            try {
                await xp.updateLastSeenPrivacy(val)
                m.reply(`✅ Last Seen diset ke: *${val}*`)
            } catch (e) {
                console.error(e); m.reply('❌ Gagal mengubah setting.')
            }
        }
    })

    // --- SET ONLINE ---
    ev.on({
        name: 'privacy_online',
        cmd: ['setonline', 'onlineprivacy'],
        tags: 'Privacy Menu',
        desc: 'Atur privasi Online (all/match_last_seen)',
        owner: true,
        run: async (xp, m, { args }) => {
            if (typeof xp.updateOnlinePrivacy !== 'function') return m.reply('❌ Fitur tidak didukung oleh library.')

            const val = args[0]?.toLowerCase()
            if (!val || !['all', 'match_last_seen'].includes(val)) {
                return m.reply('❌ Opsi: all, match_last_seen')
            }
            try {
                await xp.updateOnlinePrivacy(val)
                m.reply(`✅ Online Privacy diset ke: *${val}*`)
            } catch (e) {
                console.error(e); m.reply('❌ Gagal mengubah setting.')
            }
        }
    })

    // --- SET PROFILE PICTURE ---
    ev.on({
        name: 'privacy_pp',
        cmd: ['setppprivacy', 'ppprivacy'],
        tags: 'Privacy Menu',
        desc: 'Atur privasi Foto Profil (all/contacts/none)',
        owner: true,
        run: async (xp, m, { args }) => {
            if (typeof xp.updateProfilePicturePrivacy !== 'function') return m.reply('❌ Fitur tidak didukung oleh library.')

            const val = args[0]?.toLowerCase()
            if (!val || !['all', 'contacts', 'none', 'contact_blacklist'].includes(val)) {
                return m.reply('❌ Opsi: all, contacts, none, contact_blacklist')
            }
            try {
                await xp.updateProfilePicturePrivacy(val)
                m.reply(`✅ Profile Picture Privacy diset ke: *${val}*`)
            } catch (e) {
                console.error(e); m.reply('❌ Gagal mengubah setting.')
            }
        }
    })

    // --- SET STATUS (ABOUT) ---
    ev.on({
        name: 'privacy_status',
        cmd: ['setstatusprivacy', 'aboutprivacy'],
        tags: 'Privacy Menu',
        desc: 'Atur privasi Info/About (all/contacts/none)',
        owner: true,
        run: async (xp, m, { args }) => {
            if (typeof xp.updateStatusPrivacy !== 'function') return m.reply('❌ Fitur tidak didukung oleh library.')

            const val = args[0]?.toLowerCase()
            if (!val || !['all', 'contacts', 'none', 'contact_blacklist'].includes(val)) {
                return m.reply('❌ Opsi: all, contacts, none, contact_blacklist')
            }
            try {
                await xp.updateStatusPrivacy(val)
                m.reply(`✅ Status/About Privacy diset ke: *${val}*`)
            } catch (e) {
                console.error(e); m.reply('❌ Gagal mengubah setting.')
            }
        }
    })

    // --- SET READ RECEIPTS ---
    ev.on({
        name: 'privacy_read_receipts',
        cmd: ['setreadreceipts', 'readreceipts', 'centangbiru'],
        tags: 'Privacy Menu',
        desc: 'Atur Centang Biru (all/none)',
        owner: true,
        run: async (xp, m, { args }) => {
            if (typeof xp.updateReadReceiptsPrivacy !== 'function') return m.reply('❌ Fitur tidak didukung oleh library.')

            const val = args[0]?.toLowerCase()
            // 'all' = on (blue ticks), 'none' = off (grey ticks)
            if (!val || !['all', 'none'].includes(val)) {
                return m.reply('❌ Opsi: all (Hidup), none (Mati)')
            }
            try {
                await xp.updateReadReceiptsPrivacy(val)
                m.reply(`✅ Read Receipts diset ke: *${val === 'all' ? 'ON' : 'OFF'}*`)
            } catch (e) {
                console.error(e); m.reply('❌ Gagal mengubah setting.')
            }
        }
    })

    // --- SET GROUP ADD ---
    ev.on({
        name: 'privacy_group_add',
        cmd: ['setgroupprivacy', 'groupaddprivacy'],
        tags: 'Privacy Menu',
        desc: 'Atur siapa yang bisa menambahkan bot ke grup',
        owner: true,
        run: async (xp, m, { args }) => {
            if (typeof xp.updateGroupsAddPrivacy !== 'function') return m.reply('❌ Fitur tidak didukung oleh library.')

            const val = args[0]?.toLowerCase()
            if (!val || !['all', 'contacts', 'none', 'contact_blacklist'].includes(val)) {
                return m.reply('❌ Opsi: all, contacts, none, contact_blacklist')
            }
            try {
                await xp.updateGroupsAddPrivacy(val)
                m.reply(`✅ Group Add Privacy diset ke: *${val}*`)
            } catch (e) {
                console.error(e); m.reply('❌ Gagal mengubah setting.')
            }
        }
    })
}
