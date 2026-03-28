import axios from 'axios'
import qs from 'qs'
import fetch from 'node-fetch'

export default function coding(ev) {

    // 1. RUN CODE (Multi Language)
    ev.on({
        name: 'runcode',
        cmd: ['run', 'exec_code'],
        tags: 'Tools Menu',
        desc: 'Jalankan kode program (Python, JS, C, dll)',
        owner: !1,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            let text = args.join(' ')
            let lang = args[0]?.toLowerCase()
            let code = args.slice(1).join(' ')
            
            // Check if user replied to a file
            if (m.quoted && m.quoted.msg && (m.quoted.msg.mimetype === 'text/plain' || m.quoted.msg.mimetype === 'application/javascript' || m.quoted.msg.mimetype === 'text/x-python')) {
                 const buffer = await m.quoted.download()
                 code = buffer.toString('utf-8')
                 const filename = m.quoted.msg.fileName || 'script.txt'
                 
                 // Auto-detect lang from extension
                 if (filename.endsWith('.js')) lang = 'js'
                 else if (filename.endsWith('.py')) lang = 'py'
                 else if (filename.endsWith('.c')) lang = 'c'
                 else if (filename.endsWith('.cpp')) lang = 'cpp'
                 else if (filename.endsWith('.java')) lang = 'java'
                 else if (filename.endsWith('.php')) lang = 'php'
                 else if (filename.endsWith('.go')) lang = 'go'
                 else if (filename.endsWith('.sh')) lang = 'bash'
                 else if (!lang) return xp.sendMessage(chat.id, { text: '⚠️ Tentukan bahasa! Contoh: .run js (reply file)' }, { quoted: m })
            } 
            else if (args.length < 2) {
                return xp.sendMessage(chat.id, { 
                text: `⚠️ *FORMAT SALAH*\n\nGunakan: .run <bahasa> <kode>\nAtau Reply file .js/.py dengan caption .run\n\nContoh:\n.run python print("Hello World")\n.run js console.log("Test")` 
            }, { quoted: m })
            }

            // Mapping bahasa umum ke ID Piston
            const langMap = {
                'py': 'python', 'python': 'python',
                'js': 'javascript', 'node': 'javascript', 'javascript': 'javascript',
                'c': 'c', 'cpp': 'cpp', 'c++': 'cpp',
                'java': 'java',
                'go': 'go',
                'php': 'php',
                'rb': 'ruby', 'ruby': 'ruby',
                'sh': 'bash', 'bash': 'bash'
            }

            if (!langMap[lang]) return xp.sendMessage(chat.id, { text: '❌ Bahasa tidak didukung.\nSupport: python, js, c, cpp, java, go, php, ruby, bash' }, { quoted: m })

            await xp.sendMessage(chat.id, { react: { text: '⚙️', key: m.key } })

            try {
                const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
                    language: langMap[lang],
                    version: "*",
                    files: [
                        {
                            content: code
                        }
                    ]
                })

                const { run } = res.data
                
                let output = run.output || ''
                if (!output && run.stderr) output = `Error:\n${run.stderr}`
                if (!output) output = '[No Output]'

                // Jika output terlalu panjang, kirim sebagai file
                if (output.length > 1000) {
                    await xp.sendMessage(chat.id, { 
                        document: Buffer.from(output), 
                        mimetype: 'text/plain', 
                        fileName: 'output.txt',
                        caption: `📊 *OUTPUT EXECUTION* (${res.data.language})`
                    }, { quoted: m })
                } else {
                    const txt = `💻 *CODE EXECUTOR* 💻\n\nBahasa: ${res.data.language}\nVersi: ${res.data.version}\n\n📊 *OUTPUT:*\n\`\`\`\n${output}\n\`\`\``
                    xp.sendMessage(chat.id, { text: txt }, { quoted: m })
                }

            } catch (e) {
                console.error(e)
                xp.sendMessage(chat.id, { text: 'Gagal mengeksekusi kode. API Error.' }, { quoted: m })
            }
        }
    })

    // 3. DE-OBFUSCATE / BEAUTIFY JS
    ev.on({
        name: 'deobfuscate',
        cmd: ['dec', 'decrypt', 'deobfuscate', 'beautify'],
        tags: 'Tools Menu',
        desc: 'Merapikan kode JS yang teracak (Beautify)',
        owner: !1,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            let code = args.join(' ')
            
            // Check if reply to file
            if (m.quoted && m.quoted.msg && (m.quoted.msg.mimetype === 'text/plain' || m.quoted.msg.mimetype === 'application/javascript')) {
                const buffer = await m.quoted.download()
                code = buffer.toString('utf-8')
            }

            if (!code) return xp.sendMessage(chat.id, { text: 'Masukkan kode JS atau reply file JS yang mau didecrypt/dirapikan!' }, { quoted: m })

            await xp.sendMessage(chat.id, { react: { text: '🔓', key: m.key } })

            try {
                // Gunakan API Beautifier
                const response = await fetch('https://beautifytools.com/api/v1/javascript-beautifier', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: qs.stringify({
                        code: code,
                        indent_size: 2
                    })
                })
                
                const result = await response.text()
                
                if (!result || result.trim().length === 0) throw new Error('Empty response')

                if (result.length > 2000) {
                    await xp.sendMessage(chat.id, { 
                        document: Buffer.from(result), 
                        mimetype: 'application/javascript', 
                        fileName: 'beautified.js',
                        caption: '✅ *KODE BERHASIL DIRAPIKAN*'
                    }, { quoted: m })
                } else {
                    xp.sendMessage(chat.id, { text: '```javascript\n' + result + '\n```' }, { quoted: m })
                }

            } catch (e) {
                console.error("Decrypt/Beautify Error:", e)
                xp.sendMessage(chat.id, { text: 'Gagal mendekripsi/merapikan kode. Coba lagi nanti.' }, { quoted: m })
            }
        }
    })

    // 4. HTML PREVIEW (Render to Image)
    ev.on({
        name: 'html',
        cmd: ['html', 'preview'],
        tags: 'Tools Menu',
        desc: 'Preview kode HTML jadi gambar',
        owner: !1,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const code = args.join(' ')
            if (!code) return xp.sendMessage(chat.id, { text: 'Masukkan kode HTML!' }, { quoted: m })

            await xp.sendMessage(chat.id, { react: { text: '🖼️', key: m.key } })

            const url = `https://htmlcsstoimage.com/demo_run?html=${encodeURIComponent(code)}`
            
            try {
                await xp.sendMessage(chat.id, { image: { url }, caption: 'Hasil Render HTML' }, { quoted: m })
            } catch (e) {
                xp.sendMessage(chat.id, { text: 'Gagal merender gambar.' }, { quoted: m })
            }
        }
    })
}
