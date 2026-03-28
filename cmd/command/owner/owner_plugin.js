import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { createRequire } from "module"
import { db, saveDb } from '../../../system/db/data.js' // Added DB imports

// Helper function to list files recursively
const getAllFiles = (dirPath, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []

    files.forEach((file) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })
    return arrayOfFiles
}

export default function(ev) {
    ev.on({
        name: 'plugin',
        cmd: ['cmd', 'command'], 
        tags: 'Owner Menu',
        desc: 'Manage Command Files (Add, Del, List)',
        run: async (xp, m, { args, command, isCreator }) => {
            // Security Check
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591' // Fallback
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe
            
            if (!isOwner) return m.reply('❌ Fitur ini khusus Owner (Berbahaya).')

            const action = args[0]
            const target = args.slice(1).join(' ')
            
            // Base directory: cmd/command
            const baseDir = path.join(process.cwd(), 'cmd/command')

            if (!action) {
                return m.reply(`🧩 *EMITTER / COMMAND MANAGER*
                
Modifikasi struktur untuk: *cmd/command:*

• *${args[0] || '.cmd'} +* <kategori/nama> (Reply Code)
• *${args[0] || '.cmd'} -* <kategori/nama> (Hapus File)
• *${args[0] || '.cmd'} ?* <kategori/nama> (Preview Code)
• *${args[0] || '.cmd'} check* <kategori/nama> (Check Syntax)
• *${args[0] || '.cmd'} list*

*Contoh:*
.cmd + tools/remini.js (Reply kodenya)`)
            }

            // --- LIST FILES ---
            if (action === 'list') {
                try {
                    const allFiles = getAllFiles(baseDir)
                    const structure = {}
                    let total = 0

                    allFiles.forEach(f => {
                        const relative = path.relative(baseDir, f)
                        const dirname = path.dirname(relative)
                        const basename = path.basename(relative)

                        if (!structure[dirname]) structure[dirname] = []
                        structure[dirname].push(basename)
                        total++
                    })

                    let txt = `📂 *CMD STRUCTURE* (Total: ${total})
`
                    for (const [folder, files] of Object.entries(structure)) {
                        txt += `
📂 *${folder === '.' ? 'root' : folder}*
`
                        files.sort().forEach(f => {
                            txt += `  📄 ${f}
`
                        })
                    }
                    
                    m.reply(txt)
                } catch (e) {
                    m.reply('❌ Gagal membaca directory: ' + e.message)
                }
                return
            }

            // --- ADD FILE (+) ---
            if (action === '+') {
                if (!target) return m.reply('❌ Masukkan nama path. Contoh: .cmd + rpg/pedang')
                if (!m.quoted) return m.reply('❌ Reply kode script yang ingin disimpan.')

                let savePath = path.join(baseDir, target)
                // Jika owner tidak menulis ekstensi .js, tambahkan
                if (!savePath.endsWith('.js')) savePath += '.js'

                const dir = path.dirname(savePath)

                try {
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
                    
                    // Ambil fitur dari pesan yang di-reply
                    const content = m.quoted.text || m.quoted.caption || ''
                    if (!content) return m.reply('❌ Pesan yang di-reply kosong.')

                    fs.writeFileSync(savePath, content)
                    
                    // Syntax Check
                    exec(`node -c "${savePath}"`, (err, stdout, stderr) => {
                        if (err) {
                            m.reply(`⚠️ *BERHASIL DISIMPAN TAPI ERROR*

File saved: ${target}.js

❌ Syntax Error:
${stderr}`)
                        } else {
                            m.reply(`✅ *BERHASIL DISIMPAN*

📂 Path: cmd/command/${target}.js

_Catatan: Jika fitur tidak muncul, lakukan restart bot (.restart)_`)
                        }
                    })

                } catch (e) {
                    m.reply('❌ Gagal menyimpan: ' + e.message)
                }
                return
            }

            // --- DELETE FILE (-) ---
            if (action === '-') {
                if (!target) return m.reply('❌ Masukkan nama file. Contoh: .cmd - rpg/pedang')
                
                let targetPath = path.join(baseDir, target)
                if (!fs.existsSync(targetPath) && fs.existsSync(targetPath + '.js')) targetPath += '.js'

                if (!fs.existsSync(targetPath)) return m.reply('❌ File tidak ditemukan.')

                try {
                    fs.unlinkSync(targetPath)
                    m.reply(`🗑️ Berhasil menghapus *${path.basename(targetPath)}*`)
                } catch (e) {
                    m.reply('❌ Gagal menghapus: ' + e.message)
                }
                return
            }

            // --- GET FILE (?) ---
            if (action === '?' || action === 'get') {
                if (!target) return m.reply('❌ Masukkan nama file. Contoh: .cmd ? rpg/pedang')
                
                let targetPath = path.join(baseDir, target)
                if (!fs.existsSync(targetPath) && fs.existsSync(targetPath + '.js')) targetPath += '.js'

                if (!fs.existsSync(targetPath)) return m.reply('❌ File tidak ditemukan.')

                try {
                    const content = fs.readFileSync(targetPath, 'utf-8')
                    m.reply(content)
                } catch (e) {
                    m.reply('❌ Gagal membaca: ' + e.message)
                }
                return
            }

            // --- CHECK SYNTAX (check/fix) ---
            if (action === 'check' || action === 'fix') {
                if (!target) return m.reply('❌ Masukkan nama file. Contoh: .cmd check rpg/pedang')
                
                let targetPath = path.join(baseDir, target)
                if (!fs.existsSync(targetPath) && fs.existsSync(targetPath + '.js')) targetPath += '.js'

                if (!fs.existsSync(targetPath)) return m.reply('❌ File tidak ditemukan.')

                m.reply('🔍 Checking syntax...')
                exec(`node -c "${targetPath}"`, (err, stdout, stderr) => {
                    if (err) {
                        m.reply(`❌ *SYNTAX ERROR*

${stderr}`)
                    } else {
                        m.reply(`✅ *SYNTAX VALID*`)
                    }
                })
                return
            }
        }
    })
}