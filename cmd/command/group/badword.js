import { saveGc, getGc } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'badword',
        cmd: ['addbadword', 'delbadword', 'listbadword'],
        tags: 'Group Menu',
        desc: 'Atur kata terlarang di grup',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, command, chat }) => {
            const gcData = getGc(m.chat)
            if (!gcData) return m.reply('Data grup tidak ditemukan.')

            // Initialize if not exists
            if (!gcData.badwords) gcData.badwords = []

            if (command === 'addbadword') {
                if (!args[0]) return m.reply('Kata apa yang mau dilarang?')
                const word = args.join(' ').toLowerCase()
                
                if (gcData.badwords.includes(word)) return m.reply('⚠️ Kata tersebut sudah ada di daftar.')
                
                gcData.badwords.push(word)
                saveGc()
                m.reply(`✅ Berhasil menambahkan kata terlarang: *${word}*`)
            } 
            
            else if (command === 'delbadword') {
                if (!args[0]) return m.reply('Kata apa yang mau dihapus?')
                const word = args.join(' ').toLowerCase()
                
                const index = gcData.badwords.indexOf(word)
                if (index === -1) return m.reply('⚠️ Kata tersebut tidak ditemukan di daftar.')
                
                gcData.badwords.splice(index, 1)
                saveGc()
                m.reply(`✅ Berhasil menghapus kata terlarang: *${word}*`)
            }

            else if (command === 'listbadword') {
                if (gcData.badwords.length === 0) return m.reply('Belum ada kata terlarang khusus grup ini.')
                m.reply(`📜 *DAFTAR BADWORD GRUP*\n\n${gcData.badwords.map((w, i) => `${i+1}. ${w}`).join('\n')}`)
            }
        }
    })
}