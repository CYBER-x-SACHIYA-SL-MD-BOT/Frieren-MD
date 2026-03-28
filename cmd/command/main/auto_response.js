import { db, saveDb } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'addresp',
        cmd: ['addresp', 'addrespon', 'tambahrespon'],
        tags: 'Owner Menu',
        desc: 'Tambah auto-respon pesan (tanpa prefix)',
        owner: true,
        run: async (xp, m, { args, command }) => {
            const input = args.join(' ')
            if (!input.includes('|')) return m.reply(`❌ Format salah!\n\nContoh: .${command} assalamualaikum|waalaikumsalam, ada yang bisa dibantu?`)

            const [key, ...respParts] = input.split('|')
            const resp = respParts.join('|').trim()
            const k = key.trim().toLowerCase()

            if (!db().respon) db().respon = {}
            
            db().respon[k] = resp
            saveDb()

            m.reply(`✅ Berhasil menambah respon cepat.\n\n🔑 Kunci: ${k}\n💬 Balasan: ${resp}`)
        }
    })

    ev.on({
        name: 'delresp',
        cmd: ['delresp', 'delrespon', 'hapusrespon'],
        tags: 'Owner Menu',
        desc: 'Hapus auto-respon pesan',
        owner: true,
        run: async (xp, m, { args }) => {
            const k = args.join(' ').toLowerCase()
            if (!k) return m.reply('❌ Masukkan kata kunci yang mau dihapus.')

            if (!db().respon || !db().respon[k]) return m.reply('❌ Kata kunci tidak ditemukan.')

            delete db().respon[k]
            saveDb()

            m.reply(`✅ Berhasil menghapus respon untuk kata kunci: *${k}*`)
        }
    })

    ev.on({
        name: 'listresp',
        cmd: ['listresp', 'daftarrespon'],
        tags: 'Owner Menu',
        desc: 'Lihat daftar auto-respon',
        owner: true,
        run: async (xp, m, { chat }) => {
            if (!db().respon || Object.keys(db().respon).length === 0) return m.reply('Belum ada auto-respon yang diatur.')

            let txt = `⚡ *DAFTAR FAST RESPONSE* ⚡\n\n`
            Object.keys(db().respon).forEach((k, i) => {
                txt += `${i + 1}. *${k}* ➔ ${db().respon[k]}\n`
            })

            m.reply(txt)
        }
    })
}