import { normalizeJid } from '../../../system/msg.js'

export default function(ev) {
    ev.on({
        name: 'delete',
        cmd: ['delete', 'del', 'd', 'hapus'],
        tags: 'Tools Menu',
        desc: 'Hapus pesan (Reply pesan yang ingin dihapus)',
        run: async (xp, m, { args, isGroup, isAdmin, isBotAdmin, isOwner }) => {
            if (!m.quoted) return m.reply('❌ Reply pesan yang ingin dihapus!')

            try {
                const targetKey = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                }

                // Logic Permission:
                // 1. Pesan Bot sendiri (fromMe) -> Bebas hapus
                // 2. Pesan Orang Lain (di Grup) -> Butuh Admin & Bot Admin
                // 3. Pesan Orang Lain (di PC) -> Tidak bisa (kecuali modifikasi WA)

                if (targetKey.fromMe) {
                    // Bot message: Delete directly
                    await xp.sendMessage(m.chat, { delete: targetKey })
                } else if (isGroup) {
                    // Other's message in Group
                    if (!isBotAdmin) return m.reply('❌ Bot bukan Admin, tidak bisa menghapus pesan orang lain.')
                    if (!isAdmin && !isOwner) return m.reply('❌ Fitur hapus pesan orang lain hanya untuk Admin.')

                    await xp.sendMessage(m.chat, { delete: targetKey })
                } else {
                    m.reply('❌ Tidak bisa menghapus pesan orang lain di Private Chat.')
                }

            } catch (e) {
                console.error('Delete Error:', e)
                m.reply('❌ Gagal menghapus pesan.')
            }
        }
    })
}
