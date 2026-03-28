import fs from 'fs'
import path from 'path'

export default function(ev) {
    // --- CONVERT TEXT TO FILE ---
    ev.on({
        name: 'convert_code',
        cmd: ['tojs', 'topy', 'tohtml', 'totxt', 'tofile'],
        tags: 'Tools Menu',
        desc: 'Ubah teks kode menjadi file (.js, .py, dll)',
        run: async (xp, m, { args, command, chat }) => {
            const content = m.quoted ? (m.quoted.text || m.quoted.caption || '') : args.join(' ')
            if (!content) return m.reply(`⚠️ Masukkan kode atau reply pesan!\n\nContoh:\n.${command} console.log("Hello")`)

            let ext = 'txt'
            let mime = 'text/plain'

            // Tentukan ekstensi berdasarkan command
            switch (command) {
                case 'tojs': ext = 'js'; mime = 'application/javascript'; break;
                case 'topy': ext = 'py'; mime = 'text/x-python'; break;
                case 'tohtml': ext = 'html'; mime = 'text/html'; break;
                case 'totxt': ext = 'txt'; mime = 'text/plain'; break;
                case 'tofile': 
                    // Jika tofile, user harus tentukan nama file di awal args
                    if (args.length > 0 && args[0].includes('.')) {
                        ext = args[0].split('.').pop()
                        // Hapus arg pertama dari konten jika user ketik langsung
                        if (!m.quoted) content = args.slice(1).join(' ')
                    }
                    break;
            }

            const fileName = `code_${Date.now()}.${ext}`
            
            try {
                // Kirim langsung dari Buffer (tidak perlu simpan ke disk server)
                await xp.sendMessage(chat.id, { 
                    document: Buffer.from(content), 
                    mimetype: mime, 
                    fileName: fileName,
                    caption: `✅ Berhasil dikonversi ke *${fileName}*`
                }, { quoted: m })

            } catch (e) {
                console.error('Convert Code Error:', e)
                m.reply('Gagal membuat file.')
            }
        }
    })
}
