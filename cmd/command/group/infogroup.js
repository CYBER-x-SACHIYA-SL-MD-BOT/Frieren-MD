import { groupCache, getMetadata } from '../../../system/function.js'

export default function(ev) {
    ev.on({
        name: 'infogroup',
        cmd: ['infogroup', 'infogc', 'groupinfo'],
        tags: 'Group Menu',
        desc: 'Menampilkan informasi lengkap grup',
        group: true,
        run: async (xp, m, { chat }) => {
            try {
                await xp.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

                // Force fetch latest metadata
                const metadata = await xp.groupMetadata(m.chat)
                
                // Process Members
                const participants = metadata.participants
                const admins = participants.filter(p => p.admin)
                const owner = metadata.owner || admins.find(p => p.admin === 'superadmin')?.id || m.chat.split('-')[0] + '@s.whatsapp.net'
                
                // Format Dates
                const creation = metadata.creation 
                    ? new Date(metadata.creation * 1000).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }) 
                    : '(unknown)'

                // Format Admin List
                const adminList = admins.map((a, i) => `   ${i+1}. @${a.id.split('@')[0]} (${a.admin === 'superadmin' ? 'SuperAdmin' : 'Admin'})`).join('\n') || '-'

                // Community / Newsletter check (Metadata flags)
                const isCommunity = metadata.isCommunity ? '✅ Yes' : '❌ No'
                const isParent = metadata.isCommunityAnnounce ? '✅ Yes' : '❌ No'

                // Ephemeral Setting
                const ephemeralMap = {
                    86400: "24 Jam",
                    604800: "7 Hari",
                    2592000: "90 Hari"
                }
                const ephemeral = ephemeralMap[metadata.ephemeralDuration] || (metadata.ephemeralDuration ? `${metadata.ephemeralDuration}s` : 'Mati')

                const txt = `🏢 *GROUP INFORMATION* 🏢
━━━━━━━━━━━━━━━━━━
🏷️ *Nama:* ${metadata.subject}
🆔 *ID:* ${metadata.id}
👑 *Owner:* @${owner.split('@')[0]}
📅 *Dibuat:* ${creation}

👥 *Anggota:* ${participants.length}
👮 *Admin:* ${admins.length}
⏳ *Pesan Sementara:* ${ephemeral}
🔒 *Edit Info:* ${metadata.restrict ? 'Hanya Admin' : 'Semua Peserta'}
📩 *Kirim Pesan:* ${metadata.announce ? 'Hanya Admin' : 'Semua Peserta'}
💠 *Community:* ${isCommunity} (Announce: ${isParent})

📝 *Deskripsi:*
${metadata.desc?.toString() || '(Tidak ada deskripsi)'}

📋 *Daftar Admin:*
${adminList}
━━━━━━━━━━━━━━━━━━`

                // Get Profile Picture
                let ppUrl
                try {
                    ppUrl = await xp.profilePictureUrl(m.chat, 'image')
                } catch {
                    ppUrl = null
                }

                // Send Message
                const mentions = [...admins.map(a => a.id), owner]
                
                if (ppUrl) {
                    await xp.sendMessage(m.chat, { 
                        image: { url: ppUrl }, 
                        caption: txt, 
                        mentions 
                    }, { quoted: m })
                } else {
                    await xp.sendMessage(m.chat, { text: txt, mentions }, { quoted: m })
                }

            } catch (e) {
                console.error('InfoGC Error:', e)
                m.reply('Gagal mengambil info grup. Pastikan bot ada di dalam grup.')
            }
        }
    })
}
