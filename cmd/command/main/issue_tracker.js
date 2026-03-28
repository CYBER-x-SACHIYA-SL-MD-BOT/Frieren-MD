import { db, saveDb, randomId } from '../../../system/db/data.js'

export default function(ev) {
    
    // --- REPORT BUG (USER) ---
    ev.on({
        name: 'reportbug',
        cmd: ['reportbug', 'laporbug', 'bug'],
        tags: 'Main Menu',
        desc: 'Laporkan error atau bug ke owner',
        run: async (xp, m, { args, command }) => {
            const text = args.join(' ')
            if (!text) return m.reply(`❌ Jelaskan bug yang kamu temukan.\n> Contoh: .${command} Fitur stiker tidak bisa digunakan saat reply video`)

            if (!db().issues) db().issues = []

            const id = 'BUG_' + Date.now().toString(36).toUpperCase()
            const newIssue = {
                id: id,
                title: text.length > 30 ? text.substring(0, 30) + '...' : text,
                desc: text,
                priority: 'MEDIUM', // Default priority for user reports
                status: 'OPEN',
                reporter: m.sender,
                createdAt: Date.now(),
                fixedAt: 0,
                fixNote: ''
            }

            db().issues.push(newIssue)
            saveDb()

            m.reply(`✅ *Laporan Diterima!*\n\n🆔 ID: ${id}\n📌 Owner akan memeriksanya.\nTerima kasih atas laporannya!`)

            // Notif Owner
            const ownerJid = global.ownerNumber[0] // Assuming first owner is main
            if (ownerJid) {
                const notif = `🚨 *LAPORAN BUG BARU* 🚨\n\n👤 Pelapor: @${m.sender.split('@')[0]}\n📝 Pesan: ${text}\n🆔 ID: ${id}\n\nCek detail: .listissue`
                xp.sendMessage(ownerJid, { text: notif, mentions: [m.sender] })
            }
        }
    })

    // --- ADD ISSUE (OWNER) ---
    ev.on({
        name: 'addissue',
        cmd: ['addissue', 'tambahmasalah'],
        tags: 'Owner Menu',
        desc: 'Tambah daftar perbaikan manual (Format: Judul|Deskripsi|Prioritas)',
        owner: true,
        run: async (xp, m, { args }) => {
            const input = args.join(' ')
            if (!input.includes('|')) return m.reply(`❌ Format salah!\n\nGunakan: .addissue Judul|Deskripsi|Prioritas\n\nPrioritas: LOW, MEDIUM, HIGH, CRITICAL`)

            let [title, desc, priority] = input.split('|')
            priority = priority?.trim().toUpperCase() || 'MEDIUM'
            
            if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) priority = 'MEDIUM'

            if (!db().issues) db().issues = []

            const id = 'DEV_' + Date.now().toString(36).toUpperCase()
            const newIssue = {
                id: id,
                title: title.trim(),
                desc: desc.trim(),
                priority: priority,
                status: 'OPEN',
                reporter: 'Owner',
                createdAt: Date.now(),
                fixedAt: 0,
                fixNote: ''
            }

            db().issues.push(newIssue)
            saveDb()

            m.reply(`✅ *Issue Ditambahkan*\n\n🆔 ID: ${id}\n🏷️ Prioritas: ${priority}\n📌 Judul: ${title.trim()}`)
        }
    })

    // --- LIST ISSUE (OPEN) ---
    ev.on({
        name: 'listissue',
        cmd: ['listissue', 'listbug', 'todo'],
        tags: 'Owner Menu',
        desc: 'Lihat daftar bug/issue yang belum selesai',
        owner: true,
        run: async (xp, m, { chat }) => {
            if (!db().issues || db().issues.length === 0) return m.reply('✅ Tidak ada issue yang tercatat. Sistem aman!')

            const openIssues = db().issues.filter(i => i.status === 'OPEN')
            if (openIssues.length === 0) return m.reply('🎉 Semua issue telah diselesaikan!')

            // Sort by Priority (Critical first)
            const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 }
            openIssues.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

            let txt = `🛠️ *DAFTAR PERBAIKAN (TODO)* 🛠️\n`
            txt += `Total: ${openIssues.length} Pending\n\n`

            openIssues.forEach((i, idx) => {
                const date = new Date(i.createdAt).toLocaleDateString('id-ID')
                const pIcon = i.priority === 'CRITICAL' ? '🔴' : i.priority === 'HIGH' ? '🟠' : i.priority === 'MEDIUM' ? '🟡' : '🟢'
                
                txt += `${idx + 1}. ${pIcon} *[${i.priority}]* ${i.title}\n`
                txt += `   🆔 ${i.id}\n`
                txt += `   📝 ${i.desc}\n`
                txt += `   📅 ${date} | 👤 ${i.reporter === 'Owner' ? 'Owner' : '@' + i.reporter.split('@')[0]}\n\n`
            })

            txt += `_Gunakan .fixissue <ID>|<Catatan> untuk menyelesaikannya._`
            
            // Collect mentions for reporters
            const mentions = openIssues.filter(i => i.reporter !== 'Owner').map(i => i.reporter)
            m.reply(txt, { mentions })
        }
    })

    // --- FIX ISSUE (CLOSE) ---
    ev.on({
        name: 'fixissue',
        cmd: ['fixissue', 'fixbug', 'selesaikan'],
        tags: 'Owner Menu',
        desc: 'Tandai issue sebagai selesai',
        owner: true,
        run: async (xp, m, { args }) => {
            const input = args.join(' ')
            const [id, ...noteParts] = input.split('|')
            const note = noteParts.join('|').trim() || 'Perbaikan selesai.'

            if (!id) return m.reply('❌ Masukkan ID Issue.\nContoh: .fixissue BUG_K2J3|Sudah diperbaiki di file x')

            if (!db().issues) return m.reply('Data kosong.')

            const index = db().issues.findIndex(i => i.id === id.trim())
            if (index === -1) return m.reply('❌ ID Issue tidak ditemukan.')

            const issue = db().issues[index]
            if (issue.status === 'CLOSED') return m.reply('⚠️ Issue ini sudah ditandai selesai sebelumnya.')

            // Update Status
            issue.status = 'CLOSED'
            issue.fixedAt = Date.now()
            issue.fixNote = note
            saveDb()

            let txt = `✅ *ISSUE RESOLVED*\n\n`
            txt += `🆔 ID: ${issue.id}\n`
            txt += `📌 Judul: ${issue.title}\n`
            txt += `🛠️ Catatan: ${note}\n`
            txt += `⏱️ Durasi: ${((Date.now() - issue.createdAt) / 3600000).toFixed(1)} Jam`

            m.reply(txt)
        }
    })

    // --- HISTORY ISSUE ---
    ev.on({
        name: 'historyissue',
        cmd: ['historyissue', 'riwayatbug'],
        tags: 'Owner Menu',
        desc: 'Lihat riwayat perbaikan',
        owner: true,
        run: async (xp, m, { chat }) => {
            if (!db().issues) return m.reply('Belum ada riwayat.')

            const closedIssues = db().issues.filter(i => i.status === 'CLOSED').reverse() // Newest first
            if (closedIssues.length === 0) return m.reply('Belum ada perbaikan yang selesai.')

            let txt = `📜 *RIWAYAT PERBAIKAN* 📜\n`
            txt += `Total Selesai: ${closedIssues.length}\n\n`

            closedIssues.slice(0, 10).forEach((i, idx) => {
                const date = new Date(i.fixedAt).toLocaleDateString('id-ID')
                txt += `${idx + 1}. ✅ *${i.title}*\n`
                txt += `   🛠️ Fix: ${i.fixNote}\n`
                txt += `   📅 ${date}\n\n`
            })

            m.reply(txt)
        }
    })
}
