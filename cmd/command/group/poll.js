export default function(ev) {
    ev.on({
        name: 'poll',
        cmd: ['poll', 'voting', 'vote'],
        tags: 'Group Menu',
        desc: 'Buat voting/polling di grup',
        run: async (xp, m, { args, chat }) => {
            // Format: .poll Judul | Opsi1 | Opsi2 | ...
            const text = args.join(' ')
            if (!text.includes('|')) {
                return m.reply(`⚠️ *FORMAT POLL*\n\nGunakan format:\n.poll Judul | Opsi1 | Opsi2 ...\n\nContoh:\n.poll Makan apa? | Bakso | Mie Ayam | Nasi Goreng`)
            }

            const split = text.split('|')
            const name = split[0].trim()
            const values = split.slice(1).map(v => v.trim()).filter(v => v)

            if (values.length < 2) return m.reply('⚠️ Minimal 2 opsi jawaban.')

            try {
                await xp.sendMessage(chat.id, {
                    poll: {
                        name: name,
                        values: values,
                        selectableCount: 0
                    }
                })
            } catch (e) {
                console.error('Poll Error:', e)
                m.reply('Gagal membuat poll.')
            }
        }
    })
}

