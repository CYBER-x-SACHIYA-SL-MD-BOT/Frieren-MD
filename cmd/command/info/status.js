import os from 'os'
import si from 'systeminformation'
import moment from 'moment-timezone'
import { db } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'status',
        cmd: ['status', 'botstatus', 'statsbot'],
        tags: 'Main Menu',
        desc: 'Menampilkan status dan performa bot',
        run: async (xp, m, { usedPrefix, command }) => {
            try {
                await xp.sendMessage(m.chat, { react: { text: '📊', key: m.key } })

                // --- Performance & System Data ---
                const start = Date.now()
                const uptime = process.uptime()
                const ramUsage = process.memoryUsage().rss
                const totalRam = os.totalmem()
                const freeRam = os.freemem()
                
                // systeminformation data (CPU & Platform)
                const cpu = await si.cpu()
                const osInfo = await si.osInfo()
                
                const ping = Date.now() - start
                
                // --- Bot Stats ---
                const totalUser = Object.keys(db().key || {}).length
                const totalGroup = Object.values(await xp.groupFetchAllParticipating()).length
                
                // --- Formatting ---
                const formatSize = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
                const formatUptime = (seconds) => {
                    const d = Math.floor(seconds / (3600 * 24))
                    const h = Math.floor((seconds % (3600 * 24)) / 3600)
                    const m = Math.floor((seconds % 3600) / 60)
                    const s = Math.floor(seconds % 60)
                    return `${d}d ${h}h ${m}m ${s}s`
                }

                const statusTxt = `📊 *SYSTEM MONITORING* 📊

🚀 *Bot Performance:*
- Ping: ${ping}ms
- Uptime: ${formatUptime(uptime)}
- Mode: ${global.public ? 'Public' : 'Self'}
- Maintenance: ${global.maintenance ? '✅ ON' : '❌ OFF'}

💻 *Server Info:*
- OS: ${osInfo.distro} (${osInfo.release})
- CPU: ${cpu.manufacturer} ${cpu.brand}
- RAM: ${formatSize(ramUsage)} / ${formatSize(totalRam)}
- CPU Load: ${os.loadavg()[0].toFixed(2)}%

👥 *Bot Statistics:*
- Total Users: ${totalUser.toLocaleString()}
- Total Groups: ${totalGroup.toLocaleString()}

📅 *Server Time:* ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')} WIB`

                await xp.sendMessage(m.chat, { 
                    text: statusTxt,
                    contextInfo: {
                        externalAdReply: {
                            title: `STATUS: ONLINE`,
                            body: global.botFullName,
                            mediaType: 1,
                            thumbnailUrl: global.thumbnail,
                            sourceUrl: global.linkCh,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m })

            } catch (e) {
                console.error('Status Error:', e)
                m.reply('❌ Terjadi kesalahan saat mengambil status sistem.')
            }
        }
    })
}
