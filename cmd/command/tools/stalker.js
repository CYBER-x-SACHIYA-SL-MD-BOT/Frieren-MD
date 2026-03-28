import fetch from 'node-fetch'

export default function(ev) {
    // --- IGSTALK ---
    ev.on({
        name: 'igstalk',
        cmd: ['igstalk'],
        tags: 'Tools Menu',
        desc: 'Stalking instagram',
        run: async (xp, m, { args, chat }) => {
          try {
            const username = args[0]
            if (!username) return m.reply('Contoh: .igstalk jokowi')
            await xp.sendMessage(chat.id, { react: { text: '🔍', key: m.key } })
    
            const res = await fetch(`https://api.deline.web.id/stalker/igstalk?username=${username}`)
            const json = await res.json()
            if (!json.status) return m.reply('User tidak ditemukan.')
            
            const data = json.result
            const caption = `📸 *INSTAGRAM PROFILE* 📸\n━━━━━━━━━━━━━━━━\n` +
                            `👤 *Username:* ${data.username}\n` +
                            `📛 *Name:* ${data.full_name || '-'}\n` +
                            `👥 *Followers:* ${data.followers}\n` +
                            `👣 *Following:* ${data.following}\n` +
                            `📝 *Bio:* ${data.biography || '-'}\n` +
                            `🖼️ *Posts:* ${data.posts}\n━━━━━━━━━━━━━━━━`

            const pp = data.photo_profile || data.profile_pic_url
            await xp.sendMessage(chat.id, { image: { url: pp }, caption }, { quoted: m })
          } catch (e) { m.reply('Error fetching IG data.') }
        }
    })
    
    // --- GITHUB STALK ---
    ev.on({
        name: 'github',
        cmd: ['github', 'ghstalk'],
        tags: 'Tools Menu',
        desc: 'Stalking Github',
        run: async (xp, m, { args, chat }) => {
            try {
                const username = args[0]
                if (!username) return m.reply('Username?')
                await xp.sendMessage(chat.id, { react: { text: '🐙', key: m.key } })
    
                const api = `https://api.elrayyxml.web.id/api/stalker/github?username=${encodeURIComponent(username)}`
                const { status, result } = await fetch(api).then(res => res.json())
    
                if (!status || !result) return m.reply('User tidak ditemukan.')
    
                const txt = `🐙 *GITHUB PROFILE* 🐙\n━━━━━━━━━━━━━━━━\n` +
                            `👤 *Username:* ${result.username}\n` +
                            `📛 *Name:* ${result.nickname || '-'}\n` +
                            `📝 *Bio:* ${result.bio || '-'}\n` +
                            `📍 *Loc:* ${result.location || '-'}\n` +
                            `📚 *Repos:* ${result.public_repo}\n` +
                            `👥 *Followers:* ${result.followers}\n` +
                            `👣 *Following:* ${result.following}\n` +
                            `🔗 *URL:* ${result.url}`
    
                await xp.sendMessage(chat.id, { image: { url: result.profile_pic }, caption: txt }, { quoted: m })
            } catch (e) { m.reply('Error fetching Github data.') }
        }
    })
    
    // --- TTSTALK (Aesthetic) ---
    ev.on({
        name: 'ttstalk',
        cmd: ['ttstalk', 'tiktokstalk'],
        tags: 'Tools Menu',
        desc: 'Stalking TikTok',
        run: async (xp, m, { args, chat }) => {
            try {
                const username = args[0]
                if (!username) return m.reply('Username?')
                await xp.sendMessage(chat.id, { react: { text: '🎵', key: m.key } })
    
                const url = `https://api.deline.web.id/stalker/ttstalk?username=${encodeURIComponent(username)}`
                const res = await fetch(url).then(r => r.json())
                
                if (!res.status) return m.reply('User not found.')
                const u = res.result.user
                const s = res.result.stats
    
                const caption = `🎵 *TIKTOK PROFILE* 🎵\n━━━━━━━━━━━━━━━━\n` +
                                `👤 *Username:* ${u.uniqueId}\n` +
                                `📛 *Name:* ${u.nickname}\n` +
                                `📝 *Bio:* ${u.signature}\n` +
                                `🌍 *Region:* ${u.region}\n\n` +
                                `📊 *STATS*\n` +
                                `👥 Followers: ${s.followerCount.toLocaleString()}\n` +
                                `👣 Following: ${s.followingCount.toLocaleString()}\n` +
                                `❤️ Hearts: ${s.heartCount.toLocaleString()}\n` +
                                `🎬 Videos: ${s.videoCount.toLocaleString()}`
                
                await xp.sendMessage(chat.id, { image: { url: u.avatarLarger }, caption }, { quoted: m })
            } catch (e) { m.reply('Error fetching TikTok data.') }
        }
    })

    // --- STALK WHATSAPP ---
    ev.on({
        name: 'stalkwa',
        cmd: ['stalkwa', 'nomorwa', 'cekwa'],
        tags: 'Tools Menu',
        desc: 'Stalking Nomor WhatsApp',
        run: async (xp, m, { args, chat }) => {
            try {
                // Determine target
                const ctx = m.message?.extendedTextMessage?.contextInfo
                const mentioned = ctx?.mentionedJid?.[0]
                const replied = ctx?.participant
                
                let inputNum = null
                if (args[0]) {
                    let n = args[0].replace(/[^0-9]/g, '')
                    if (n.startsWith('08')) n = '62' + n.slice(1)
                    inputNum = n + '@s.whatsapp.net'
                }
                
                const target = mentioned || replied || inputNum
                
                if (!target) return m.reply('❌ Tag user, reply pesan, atau masukkan nomor!\nContoh: .stalkwa 628123xxx')
                
                await xp.sendMessage(chat.id, { react: { text: '🕵️', key: m.key } })

                // Fetch Data
                let status = { status: 'Tidak ada status/privasi', setAt: null }
                let ppUrl = 'https://telegra.ph/file/9b33a55eb1e8a00473a24.jpg' // Default

                try {
                    status = await xp.fetchStatus(target)
                } catch (e) { } // Ignore if private/error

                try {
                    ppUrl = await xp.profilePictureUrl(target, 'image')
                } catch (e) { } // Ignore if no PP

                // Format Date
                let statusDate = '-'
                if (status.setAt) {
                    statusDate = new Date(status.setAt).toLocaleDateString('id-ID', { 
                        day: 'numeric', month: 'long', year: 'numeric' 
                    })
                }

                const caption = `🕵️ *STALK WHATSAPP* 🕵️
━━━━━━━━━━━━━━━━
📱 *Nomor:* +${target.split('@')[0]}
📝 *Bio:* ${status.status || '-'}
📅 *Tgl Bio:* ${statusDate}
🔗 *Link:* https://wa.me/${target.split('@')[0]}
━━━━━━━━━━━━━━━━`

                await xp.sendMessage(chat.id, { image: { url: ppUrl }, caption, mentions: [target] }, { quoted: m })

            } catch (e) {
                console.error(e)
                m.reply('❌ Gagal mengambil data. Mungkin nomor tidak valid.')
            }
        }
    })
}
