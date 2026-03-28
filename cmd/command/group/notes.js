import { getGc, saveGc } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'notes',
        cmd: ['note', 'catatan'],
        tags: 'Group Menu',
        desc: 'Simpan dan lihat catatan grup',
        group: true,
        run: async (xp, m, { args, command }) => {
            const gcData = getGc(m.chat)
            if (!gcData) return m.reply('Data grup belum siap.')

            gcData.notes = gcData.notes || {}

            const action = args[0]?.toLowerCase()
            
            // LIST (Default if no args or 'list')
            if (!action || action === 'list') {
                const keys = Object.keys(gcData.notes)
                if (keys.length === 0) return m.reply('📝 Belum ada catatan di grup ini.')
                return m.reply(`📝 *DAFTAR CATATAN GRUP*\n\n${keys.map((k, i) => `${i+1}. ${k}`).join('\n')}\n\nKetik *.note <nama>* untuk melihat isi. `)
            }

            // ADD
            if (action === 'add' || action === 'tambah' || action === 'create') {
                // Check Admin
                const isAdmin = m.isAdmin || m.isBotAdmin || (m.key.participant && (await xp.groupMetadata(m.chat)).participants.find(p => p.id === m.sender)?.admin)
                // Note: m.isAdmin might be injected by middleware, but verifying is safer or just use middleware if reliable.
                // Assuming middleware populates m.isAdmin.
                
                if (!m.isAdmin && !global.ownerNumber.includes(m.sender.split('@')[0])) return m.reply('❌ Hanya admin yang bisa membuat catatan.')
                
                const name = args[1]?.toLowerCase()
                const content = args.slice(2).join(' ')
                
                if (!name || !content) return m.reply(`⚠️ Format salah!\nGunakan: .note add <nama_catatan> <isi>\nContoh: .note add rules Dilarang spam! `)
                
                gcData.notes[name] = content
                saveGc()
                return m.reply(`✅ Catatan *${name}* berhasil disimpan. `)
            }

            // DELETE
            if (action === 'del' || action === 'hapus') {
                if (!m.isAdmin && !global.ownerNumber.includes(m.sender.split('@')[0])) return m.reply('❌ Hanya admin yang bisa menghapus catatan.')
                
                const name = args[1]?.toLowerCase()
                if (!name) return m.reply(`⚠️ Format salah!\nGunakan: .note del <nama_catatan> `)
                
                if (!gcData.notes[name]) return m.reply('❌ Catatan tidak ditemukan.')
                
                delete gcData.notes[name]
                saveGc()
                return m.reply(`✅ Catatan *${name}* berhasil dihapus. `)
            }

            // FETCH (If not a command keyword, check if it's a note name)
            if (gcData.notes[action]) {
                return m.reply(`📝 *${action.toUpperCase()}*\n\n${gcData.notes[action]}`)
            }
            
            m.reply(`❌ Catatan *${action}* tidak ditemukan. Ketik *.note list* untuk melihat daftar. `)
        }
    })
}
