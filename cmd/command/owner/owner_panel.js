import { exec } from 'child_process'
import { sendIAMessage } from '../../../system/function.js'

// Helper untuk hapus kode warna ANSI agar teks bersih di WA
const cleanAnsi = (text) => {
    return text.replace(/[][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
}

export default function(ev) {
    ev.on({
        name: 'panel',
        cmd: ['panel', 'server', 'manage'],
        tags: 'Owner Menu',
        desc: 'Server Management Panel (No-Login Panel)',
        run: async (xp, m, { args, isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            if (!isOwner) return

            const sub = args[0]?.toLowerCase()

            if (!sub) {
                const sections = [
                    {
                        title: "🛰️ MAINTENANCE",
                        rows: [
                            { title: "GET UPDATE", description: "Git Pull (Update Script)", id: ".panel update" },
                            { title: "INSTALL DEPS", description: "NPM Install", id: ".panel install" },
                            { title: "RESTART BOT", description: "Matikan & Hidupkan ulang", id: ".restart" }
                        ]
                    },
                    {
                        title: "📊 MONITORING",
                        rows: [
                            { title: "DISK USAGE", description: "Cek sisa penyimpanan", id: ".panel disk" },
                            { title: "PROCESS LIST", description: "Cek proses Node.js", id: ".panel ps" },
                            { title: "NPM LIST", description: "Cek installed packages", id: ".panel npmls" }
                        ]
                    }
                ]

                const buttons = [{
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "⚙️ SERVER CONTROL",
                        sections: sections
                    })
                }]

                return await sendIAMessage(xp, m.chat, buttons, {
                    title: "🖥️ *SERVER EXECUTOR PANEL*",
                    body: "Gunakan panel ini untuk mengelola server tanpa membuka dashboard hosting.",
                    footer: global.botName
                }, { quoted: m })
            }

            // --- SUB COMMAND HANDLER ---
            let cmd = ''
            let msg = ''

            switch (sub) {
                case 'update': 
                    cmd = 'git pull'; msg = '📥 *Updating Script...*'; break
                case 'install': 
                    cmd = 'npm install'; msg = '📦 *Installing Dependencies...*'; break
                case 'disk': 
                    cmd = 'df -h'; msg = '💾 *Checking Disk Usage...*'; break
                case 'ps': 
                    cmd = 'pgrep -fl node || top -n 1 -b | head -n 20'; msg = '🔍 *Checking Processes...*'; break
                case 'npmls': 
                    cmd = 'npm ls --depth=0'; msg = '📋 *Listing NPM Packages...*'; break
                default:
                    return m.reply('❌ Perintah panel tidak dikenal.')
            }

            m.reply(msg)

            exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, async (err, stdout, stderr) => {
                if (err) return m.reply(`❌ ERROR:\n${err.message}`)
                
                let output = cleanAnsi(stdout || stderr)
                if (!output) return m.reply('✅ Done (No output)')

                if (output.length > 2000) {
                    await xp.sendMessage(m.chat, { 
                        document: Buffer.from(output), 
                        mimetype: 'text/plain', 
                        fileName: `${sub}_output.txt`,
                        caption: `✅ *RESULT:* ${sub.toUpperCase()}`
                    }, { quoted: m })
                } else {
                    m.reply(`✅ *RESULT:* ${sub.toUpperCase()}\n\n\`\`\`\n${output}\n\`\`\``)
                }
            })
        }
    })
}
