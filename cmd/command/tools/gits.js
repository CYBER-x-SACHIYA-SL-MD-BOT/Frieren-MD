import fetch from 'node-fetch'

export default function(ev) {
    ev.on({
        name: 'gits',
        cmd: ['gits', 'getgits'],
        tags: 'Tools Menu',
        desc: 'Ambil kode dari GitHub Gist atau Repository',
        run: async (xp, m, { args, chat, usedPrefix, command }) => {
            try {
                let text = args.join(' ')
                let [link, type] = text.split(" ")
                
                if (!link || !link.includes("github")) {
                    return m.reply(`⚠️ Masukkan Link GitHub Gist atau File Repo!\n\nContoh:\n${usedPrefix + command} https://gist.github.com/user/id\n${usedPrefix + command} https://github.com/user/repo/blob/main/file.js\n\nOpsi:\n--doc : Kirim sebagai dokumen`)
                }

                // Handle Standard GitHub Repo (blob -> raw)
                if (link.includes('github.com') && link.includes('/blob/')) {
                    let rawUrl = link.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
                    const response = await fetch(rawUrl)
                    if (!response.ok) throw new Error('Gagal mengambil file dari repository')
                    
                    const content = await response.text()
                    const filename = link.split('/').pop()

                    if (type === "--doc") {
                        await xp.sendMessage(chat.id, {
                            document: Buffer.from(content),
                            fileName: filename,
                            mimetype: 'text/plain'
                        }, { quoted: m })
                        return
                    } else {
                        await m.reply(content)
                        return
                    }
                }

                // Handle Gist
                const extractId = (url) => {
                    try {
                        const parts = new URL(url).pathname.split('/').filter(Boolean)
                        const id = parts.pop()
                        return id || null
                    } catch (e) {
                        return null
                    }
                }

                const id = extractId(link)
                if (!id) return m.reply('❌ Link Gist tidak valid.')

                const response = await fetch(`https://api.github.com/gists/${id}`)
                if (!response.ok) throw new Error('Gagal mengambil data Gist')
                
                const getRaw = await response.json()
                const files = Object.values(getRaw.files || {})

                if (files.length === 0) return m.reply('❌ Tidak ada file ditemukan dalam Gist ini.')

                for (let file of files) {
                    if (type === "--doc") {
                        const buffer = Buffer.from(file.content, "utf-8")
                        await xp.sendMessage(chat.id, {
                            document: buffer,
                            fileName: file.filename,
                            mimetype: file.type || 'text/plain'
                        }, { quoted: m })
                    } else {
                        await m.reply(file.content)
                    }
                }

            } catch (e) {
                console.error('Error gits:', e)
                m.reply("❌ Gagal mengambil Gist. Mungkin limit request atau ID salah.")
            }
        }
    })
}
