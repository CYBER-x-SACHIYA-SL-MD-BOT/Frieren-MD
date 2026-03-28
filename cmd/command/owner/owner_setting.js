import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const configPath = path.join(dirname, '../../../system/set/config.json')

// Helper function to read/write config
const updateConfig = (updater) => {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        const newConfig = updater(config)
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2))
        return true
    } catch (e) {
        console.error('Failed to update config:', e)
        return false
    }
}

export default function ownerSetting(ev) {
    
    // --- SET BOT NAME ---
    ev.on({
        name: 'setbotname',
        cmd: ['setbotname', 'setnamebot', 'setnama'],
        tags: 'Owner Menu',
        desc: 'Ganti nama bot di config',
        owner: true,
        run: async (xp, m, { args }) => {
            const name = args.join(' ')
            if (!name) return m.reply('❌ Masukkan nama baru untuk bot.')

            const success = updateConfig((config) => {
                config.botSetting.botName = name
                global.botName = name // Update runtime variable
                return config
            })

            if (success) {
                m.reply(`✅ Nama bot berhasil diubah menjadi: *${name}*`)
            } else {
                m.reply('❌ Gagal mengubah nama bot.')
            }
        }
    })

    // --- SET THUMBNAIL (From URL) ---
    ev.on({
        name: 'setthumbnail',
        cmd: ['setthumbnail', 'setthumb', 'setcover'],
        tags: 'Owner Menu',
        desc: 'Ganti thumbnail menu bot (URL)',
        owner: true,
        run: async (xp, m, { args }) => {
            const url = args[0]
            if (!url || !url.startsWith('http')) return m.reply('❌ Masukkan URL gambar yang valid.')

            const success = updateConfig((config) => {
                config.botSetting.menuSetting.thumbnail = url
                global.thumbnail = url // Update runtime variable
                return config
            })

            if (success) {
                await xp.sendMessage(m.chat, { 
                    image: { url: url }, 
                    caption: `✅ Thumbnail berhasil diubah.` 
                }, { quoted: m })
            } else {
                m.reply('❌ Gagal mengubah thumbnail.')
            }
        }
    })
    
    // --- SET THUMBNAIL 2 (From URL) ---
    ev.on({
        name: 'setthumbnail2',
        cmd: ['setthumbnail2', 'setthumb2'],
        tags: 'Owner Menu',
        desc: 'Ganti thumbnail kedua menu bot (URL)',
        owner: true,
        run: async (xp, m, { args }) => {
            const url = args[0]
            if (!url || !url.startsWith('http')) return m.reply('❌ Masukkan URL gambar yang valid.')

            const success = updateConfig((config) => {
                config.botSetting.menuSetting.thumbnail2 = url
                // Assuming there might be a global variable for this too, if not, it just updates config
                return config
            })

            if (success) {
                await xp.sendMessage(m.chat, { 
                    image: { url: url }, 
                    caption: `✅ Thumbnail 2 berhasil diubah.` 
                }, { quoted: m })
            } else {
                m.reply('❌ Gagal mengubah thumbnail 2.')
            }
        }
    })
}
