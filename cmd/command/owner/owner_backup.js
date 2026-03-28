import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'

export default function(ev) {
    // --- BACKUP SCRIPT ---
    ev.on({
        name: 'backupsc',
        cmd: ['backupsc', 'getsc'], // Menghapus 'sc' agar tidak bentrok
        tags: 'Owner Menu',
        desc: 'Backup source code bot (zip)',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')

            m.reply('📦 Sedang membuat backup script... Mohon tunggu.')

            try {
                const zip = new AdmZip()
                const rootDir = process.cwd()
                // Daftar ignore yang lebih lengkap
                const ignores = [
                    'node_modules', 
                    '.git', 
                    'package-lock.json', 
                    'connect/session', 
                    'temp', 
                    'logs',
                    'npm-debug.log',
                    'yarn-error.log',
                    '.gemini',
                    'joy-public',
                    'joy-encrypt'
                ]

                const addDirectory = (dir) => {
                    const files = fs.readdirSync(dir)
                    for (const file of files) {
                        const fullPath = path.join(dir, file)
                        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/') // Normalisasi path
                        
                        // Cek apakah file/folder ini harus diabaikan
                        const isIgnored = ignores.some(ig => {
                            return relPath === ig || relPath.startsWith(ig + '/')
                        })

                        if (isIgnored) continue

                        const stat = fs.statSync(fullPath)
                        if (stat.isDirectory()) {
                            addDirectory(fullPath)
                        } else {
                            try {
                                zip.addLocalFile(fullPath, path.dirname(relPath))
                            } catch (e) {
                                // console.error('Skip file:', file)
                            }
                        }
                    }
                }

                addDirectory(rootDir)

                const buffer = zip.toBuffer()
                const fileName = `SC_BACKUP_${new Date().toISOString().split('T')[0]}.zip`

                await xp.sendMessage(m.sender, { 
                    document: buffer, 
                    mimetype: 'application/zip', 
                    fileName: fileName,
                    caption: `📦 *BACKUP SCRIPT*\n📅 Date: ${new Date().toLocaleString()}\n\n_Note: node_modules & package-lock excluded._`
                }, { quoted: m })

                m.reply('✅ Backup script terkirim ke private chat.')

            } catch (e) {
                console.error('Backup SC Error:', e)
                m.reply('❌ Gagal membuat backup script.')
            }
        }
    })

    // --- BACKUP DATABASE ---
    ev.on({
        name: 'backupdb',
        cmd: ['backupdb', 'getdb', 'db'],
        tags: 'Owner Menu',
        desc: 'Backup database bot (zip)',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')

            m.reply('📦 Mengambil data database...')

            try {
                const zip = new AdmZip()
                const dbDir = path.join(process.cwd(), 'system/db')
                
                if (fs.existsSync(dbDir)) {
                    // Add only .json files from system/db (Exclude 'local' folder or others)
                    const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json'))
                    files.forEach(f => {
                        zip.addLocalFile(path.join(dbDir, f))
                    })
                    
                    // Removed local folder backup logic
                }

                const buffer = zip.toBuffer()
                const fileName = `DB_BACKUP_${new Date().toISOString().split('T')[0]}.zip`

                await xp.sendMessage(m.sender, { 
                    document: buffer, 
                    mimetype: 'application/zip', 
                    fileName: fileName,
                    caption: `💾 *BACKUP DATABASE*`
                }, { quoted: m })

                m.reply('✅ Backup database terkirim ke private chat.')

            } catch (e) {
                console.error('Backup DB Error:', e)
                m.reply('❌ Gagal backup database.')
            }
        }
    })
}
