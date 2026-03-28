export default function(ev) {
    ev.on({
        name: 'spamtag',
        cmd: ['spamtag', 'tagme'],
        tags: 'Group Menu',
        desc: 'Tag member berkali-kali (Max 50)',
        group: true,
        admin: true,
        prefix: true, // Only admin to prevent abuse
        run: async (xp, m, { args, chat }) => {
            let target = m.mentionedJid[0] || m.quoted?.sender
            let count = parseInt(args[1]) || parseInt(args[0]) || 5
            
            // If user types .spamtag 10 (without tag, tag themself?) or .spamtag @user 10
            if (!target && !isNaN(args[0])) {
                // No target, maybe self tag? Or reject
                // Let's require target for safety
                return m.reply('❌ Tag orang yang mau dispam!\nContoh: .spamtag @user 10')
            }
            
            if (!target) return m.reply('❌ Tag orangnya!')

            if (count > 50) {
                count = 50
                m.reply('⚠️ Maksimal 50 kali bos, jangan kebanyakan.')
            }
            
            if (count < 1) return m.reply('Mau nyepam berapa kali?')

            m.reply(`🚀 Meluncurkan ${count} tag ke @${target.split('@')[0]}...`)

            for (let i = 0; i < count; i++) {
                await xp.sendMessage(chat.id, { text: ` @${target.split('@')[0]}  (${i+1})`, mentions: [target] })
                await new Promise(r => setTimeout(r, 1500)) // Delay 1.5s to avoid ban
            }
            
           /* m.reply('✅ Selesai nyepam.') */
        }
    })
}
