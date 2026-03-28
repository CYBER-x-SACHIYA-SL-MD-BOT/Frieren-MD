import { execNpm } from '#lib/exec_npm.js'
import { exec } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'
import { db, saveDb } from '../../../system/db/data.js'
import { Inventory } from '../../../system/inventory.js'
import { createRequire } from "module"

const require = createRequire(import.meta.url)

export default function(ev) {
    // --- RESTART & SHUTDOWN ---
    ev.on({
        name: 'restart',
        cmd: ['restart', 'reboot'],
        tags: 'Owner Menu',
        desc: 'Restart bot system',
        run: async (xp, m, { isCreator }) => {
            if (!isCreator) return m.reply('❌ Fitur khusus Creator (Owner Utama).')

            m.reply('🔄 *RESTARTING SYSTEM...*\n\nBot akan mati sejenak dan hidup kembali secara otomatis.')

            setTimeout(() => {
                process.exit()
            }, 1000)
        }
    })

    ev.on({
        name: 'shutdown',
        cmd: ['shutdown', 'matikan'],
        tags: 'Owner Menu',
        desc: 'Matikan bot (Stop process)',
        run: async (xp, m, { isCreator }) => {
            if (!isCreator) return m.reply('❌ Fitur khusus Creator (Owner Utama).')

            await m.reply('🔴 *SHUTTING DOWN...*\n\nBot dimatikan. Perlu start manual dari panel/termux untuk menghidupkan kembali.')
            
            setTimeout(() => {
                process.kill(process.pid)
            }, 1000)
        }
    })

    // --- RESET LIMIT ---
    ev.on({
        name: 'resetlimit',
        cmd: ['resetlimit', 'resetlimitall'],
        tags: 'Owner Menu',
        desc: 'Reset limit semua user ke default',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')
            
            const users = db().key || {}
            let count = 0
            
            for (let k in users) {
                users[k].limit = 20 // Default limit value
                count++
            }
            saveDb()
            m.reply(`✅ Berhasil mereset limit untuk ${count} user.`)
        }
    })

    // --- ADD PREMIUM ---
    ev.on({
        name: 'addprem',
        cmd: ['addprem', 'addpremium'],
        tags: 'Owner Menu',
        desc: 'Menambahkan user premium (Timed)',
        run: async (xp, m, { args, isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')
            
            let target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
            let duration = args[1] ? parseInt(args[1]) : (m.quoted && args[0] ? parseInt(args[0]) : 0)

            if (!target) return m.reply('❌ Tag user atau masukkan nomor. Contoh: .addprem 628xxx 30')
            
            const user = Inventory.getUser(target)
            if (!user) return m.reply('❌ User belum terdaftar di database.')
            
            user.premium = true
            user.limit = 1000 // Unlimited behavior
            
            let timeTxt = 'PERMANEN'
            if (duration > 0) {
                const now = Date.now()
                const addedTime = duration * 24 * 60 * 60 * 1000
                user.premiumTime = (user.premiumTime && user.premiumTime > now ? user.premiumTime : now) + addedTime
                const date = new Date(user.premiumTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                timeTxt = `${duration} Hari (Sampai: ${date})`
            } else {
                user.premiumTime = 0 // Permanent
            }
            
            saveDb()
            m.reply(`✅ *PREMIUM ADDED*\n\n👤 User: @${target.split('@')[0]}\n⏳ Durasi: ${timeTxt}`, { mentions: [target] })
        }
    })

    // --- DELETE PREMIUM ---
    ev.on({
        name: 'delprem',
        cmd: ['delprem', 'delpremium'],
        tags: 'Owner Menu',
        desc: 'Menghapus user premium',
        run: async (xp, m, { args, isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')
            
            const target = m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
            if (!target) return m.reply('❌ Tag user atau masukkan nomor.')
            
            const user = Inventory.getUser(target)
            if (!user) return m.reply('❌ User belum terdaftar.')
            
            user.premium = false
            user.premiumTime = 0
            user.limit = 20
            saveDb()
            
            m.reply(`✅ Sukses menghapus premium dari @${target.split('@')[0]}`, { mentions: [target] })
        }
    })

    // --- SET BOT PP (FULL) ---
    ev.on({
        name: 'setppbot',
        cmd: ['setppbot', 'setbotpp', 'setpp'],
        tags: 'Owner Menu',
        desc: 'Ganti foto profil bot',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')
            
            const q = m.quoted ? m.quoted : m
            const mime = (q.msg || q).mimetype || ''
            
            if (/image/.test(mime)) {
                try {
                    const media = await q.download()
                    await xp.updateProfilePicture(xp.user.id, media)
                    m.reply('✅ Sukses mengganti foto profil bot.')
                } catch (e) {
                    m.reply('❌ Gagal mengganti foto: ' + e.message)
                }
            } else {
                m.reply('❌ Kirim/Reply gambar dengan caption .setppbot')
            }
        }
    })

    // --- SET EXIF ---
    ev.on({
        name: 'setexif',
        cmd: ['setexif', 'setstickerwm'],
        tags: 'Owner Menu',
        desc: 'Set Exif Sticker (Packname & Author)',
        run: async (xp, m, { args, isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')
            
            const input = args.join(' ')
            if (!input.includes('|')) return m.reply('❌ Format salah. Contoh: .setexif Pack Name|Author Name')
            
            const [pack, author] = input.split('|').map(v => v.trim())
            
            global.packname = pack
            global.author = author
            global.stickpack = pack
            global.stickauth = author
            
            try {
                const configPath = path.join(process.cwd(), 'system/set/config.json')
                if (fs.existsSync(configPath)) {
                    const cfg = JSON.parse(fs.readFileSync(configPath))
                    cfg.sticker = { packname: pack, author: author }
                    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2))
                }
            } catch (e) {
                console.error('Failed to save config:', e)
            }

            m.reply(`✅ Exif berhasil diubah secara permanen.\nPackname: ${pack}\nAuthor: ${author}`)
        }
    })

    // --- GET SESSION ---
    ev.on({
        name: 'getsession',
        cmd: ['getsession'],
        tags: 'Owner Menu',
        desc: 'Ambil file session (backup)',
        run: async (xp, m, { isCreator }) => {
            if (!isCreator) return m.reply('❌ Fitur ini SANGAT SENSITIF dan hanya bisa digunakan oleh Owner Utama (Creator).')
            
            await m.reply('⚠️ *WARNING: SENSITIVE DATA* ⚠️\n\nFile `creds.json` berisi kunci enkripsi sesi Anda.\n*JANGAN PERNAH* membagikan file ini kepada siapapun!\n\n_Sedang mengirim file ke Private Chat..._')
            
            try {
                const sessionPath = path.join(process.cwd(), 'connect/session/creds.json')
                
                if (fs.existsSync(sessionPath)) {
                    await xp.sendMessage(m.sender, { 
                        document: fs.readFileSync(sessionPath), 
                        mimetype: 'application/json', 
                        fileName: 'creds.json' 
                    }, { quoted: m })
                    m.reply('✅ File terkirim ke PC/Private Chat.')
                } else {
                    m.reply('❌ File session tidak ditemukan di path default.')
                }
            } catch (e) {
                m.reply('❌ Gagal mengambil session: ' + e.message)
            }
        }
    })

    // --- GET LOGS (FILE VERSION) ---
    ev.on({
        name: 'getlogs',
        cmd: ['getlogs', 'logs'],
        tags: 'Owner Menu',
        desc: 'Ambil file logs bot',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')
            
            const logFiles = ['logs/combined.log', 'logs/error.log']
            let found = false

            for (const file of logFiles) {
                const filePath = path.join(process.cwd(), file)
                if (fs.existsSync(filePath)) {
                    found = true
                    await xp.sendMessage(m.sender, { 
                        document: fs.readFileSync(filePath), 
                        mimetype: 'text/plain', 
                        fileName: path.basename(file)
                    }, { quoted: m })
                }
            }

            if (!found) {
                m.reply('❌ Tidak ada file log yang ditemukan (logs/combined.log).')
            } else {
                m.reply('✅ Log file terkirim ke PC/Private.')
            }
        }
    })

    // --- RESET LOGS ---
    ev.on({
        name: 'resetlogs',
        cmd: ['resetlogs', 'clearlogs'],
        tags: 'Owner Menu',
        desc: 'Hapus isi file log',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')

            const logFiles = ['logs/combined.log', 'logs/error.log']
            let cleared = 0

            for (const file of logFiles) {
                const filePath = path.join(process.cwd(), file)
                if (fs.existsSync(filePath)) {
                    // Truncate file (empty content)
                    fs.writeFileSync(filePath, '')
                    cleared++
                }
            }

            if (cleared > 0) {
                m.reply(`✅ Berhasil membersihkan ${cleared} file log.`)
            } else {
                m.reply('⚠️ Tidak ada file log untuk dibersihkan.')
            }
        }
    })

    // --- CLEAR CACHE ---
    ev.on({
        name: 'clearcache',
        cmd: ['clearcache', 'cleartmp'],
        tags: 'Owner Menu',
        desc: 'Hapus file sampah (tmp) agar bot ringan',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')

            const tmpDir = path.join(process.cwd(), 'temp')
            
            try {
                // Cek isi folder temp
                if (fs.existsSync(tmpDir)) {
                    const files = fs.readdirSync(tmpDir)
                    if (files.length === 0) return m.reply('🧹 Folder temp sudah bersih.')

                    let deleted = 0
                    files.forEach(file => {
                        // Jangan hapus file .file atau placeholder jika ada
                        if (file !== '.gitkeep') {
                            fs.unlinkSync(path.join(tmpDir, file))
                            deleted++
                        }
                    })
                    
                    m.reply(`✅ Berhasil menghapus *${deleted}* file sampah di folder temp.\nBot seharusnya lebih ringan sekarang.`)
                } else {
                    m.reply('📂 Folder temp tidak ditemukan (Aman).')
                }
            } catch (e) {
                console.error('Clear Cache Error:', e)
                m.reply('❌ Gagal membersihkan cache.')
            }
        }
    })
}