import { db, saveDb, saveGc, getGc } from '../../../system/db/data.js'
import c from 'chalk'

export default function(ev) {
    ev.on({
        name: 'settings_dashboard',
        cmd: ['1', 'settings', 'config'],
        tags: 'Main Menu',
        desc: 'Dashboard pengaturan Admin & Owner',
        run: async (xp, m, { args, prefix, command, isOwner, isAdmin }) => {
            const id = m.chat
            const gcData = m.isGroup ? getGc(id) : null
            
            // Map labels to DB keys/Global keys
            const adminFeatures = {
                'adminonly': { key: 'adminonly', path: 'filter' },
                'animeupdate': { key: 'animeupdate', path: 'filter' },
                'antilink': { key: 'antilink', path: 'filter' },
                'antivn': { key: 'antivn', path: 'filter' },
                'antilinkgc': { key: 'antilinkgc', path: 'filter' },
                'antilinkwa': { key: 'antilinkwa', path: 'filter' },
                'antitoxic': { key: 'antitoxic', path: 'filter' },
                'antibadword': { key: 'antibadword', path: 'filter' },
                'antidelete': { key: 'antidelete', path: 'filter' },
                'antiviewonce': { key: 'antiviewonce', path: 'filter' },
                'antisticker': { key: 'antisticker', path: 'filter' },
                'antivirtex': { key: 'antivirtex', path: 'filter' },
                'restrict': { key: 'restrict', path: 'filter' },
                'game': { key: 'game', path: 'filter', default: true },
                'rpg': { key: 'rpg', path: 'filter', default: true },
                'nsfw': { key: 'nsfw', path: 'filter' },
                'welcome': { key: 'welcomeGc', path: 'filter.welcome' },
                'autolevelup': { key: 'autolevelup', path: 'filter' },
                'autodownload': { key: 'autodownload', path: 'filter' },
                'notifgempa': { key: 'notifgempa', path: 'filter' },
                'notifazan': { key: 'notifazan', path: 'filter' },
                'otakunews': { key: 'otakunews', path: 'filter' },
                'komikuNews': { key: 'komikuNews', path: 'filter' }
            }

            const ownerFeatures = {
                'autobackup': { key: 'autobackup', type: 'global' },
                'autoread': { key: 'autoread', type: 'global' },
                'composing': { key: 'autotyping', type: 'global' },
                'gconly': { key: 'gconly', type: 'global' },
                'pconly': { key: 'pconly', type: 'global' },
                'public': { key: 'public', type: 'global' },
                'swonly': { key: 'autoreadsw', type: 'global' },
                'anticall': { key: 'anticall', type: 'global' },
                'noprint': { key: 'noprint', type: 'global' },
                'adreply': { key: 'adreply', type: 'global' },
                'noerror': { key: 'noerror', type: 'global' }
            }

            const getStatus = (feature, featureData) => {
                if (featureData.type === 'global') {
                    return global[featureData.key] ? 'ON' : 'OFF'
                }
                if (!m.isGroup) return 'N/A'
                
                // Navigate nested path
                const parts = featureData.path.split('.')
                let current = gcData
                for (const p of parts) {
                    current = current?.[p]
                }
                const val = current?.[featureData.key]
                if (val === undefined) return featureData.default ? 'ON' : 'OFF'
                return val ? 'ON' : 'OFF'
            }

            const toggleFeature = async (feature) => {
                const isOwnerFeat = !!ownerFeatures[feature]
                const isAdminFeat = !!adminFeatures[feature]

                if (!isOwnerFeat && !isAdminFeat) return m.reply(`❌ Fitur *${feature}* tidak ditemukan.`)

                if (isOwnerFeat) {
                    if (!isOwner) return m.reply('❌ Perintah ini hanya untuk Owner.')
                    const feat = ownerFeatures[feature]
                    global[feat.key] = !global[feat.key]
                    // Optional: sync to config.json here if needed
                    return m.reply(`✅ *${feature}* berhasil diubah menjadi: *${global[feat.key] ? 'ON' : 'OFF'}*`)
                }

                if (isAdminFeat) {
                    if (!m.isGroup) return m.reply('❌ Perintah ini hanya dapat digunakan di Grup.')
                    if (!isAdmin && !isOwner) return m.reply('❌ Perintah ini hanya untuk Admin.')
                    
                    const feat = adminFeatures[feature]
                    const parts = feat.path.split('.')
                    let target = gcData
                    for (const p of parts) {
                        target[p] = target[p] || {}
                        target = target[p]
                    }
                    
                    const currentVal = target[feat.key] === undefined ? !!feat.default : target[feat.key]
                    target[feat.key] = !currentVal
                    
                    await saveGc()
                    return m.reply(`✅ *${feature}* berhasil diubah menjadi: *${target[feat.key] ? 'ON' : 'OFF'}*`)
                }
            }

            // --- 1. HANDLE TOGGLE ---
            if (args[0]) {
                const target = args[0].toLowerCase()
                return await toggleFeature(target)
            }

            // --- 2. SHOW DASHBOARD ---
            let txt = `⌬ ━━━〔 *SETTINGS PANEL* 〕━━━ ⌬\n\n`
            
            txt += `◈── *ADMIN PRIVILEGES* ──◈\n`
            for (const [feat, data] of Object.entries(adminFeatures)) {
                const status = getStatus(feat, data)
                const indicator = status === 'ON' ? '🟢' : '⚪'
                const padding = '.'.repeat(Math.max(1, 15 - feat.length))
                txt += `▢ ${feat} ${padding} [ *${status}* ] ${indicator}\n`
            }

            txt += `\n◈── *OWNER PRIVILEGES* ──◈\n`
            for (const [feat, data] of Object.entries(ownerFeatures)) {
                const status = getStatus(feat, data)
                const indicator = status === 'ON' ? '🔵' : '⚪'
                const padding = '.'.repeat(Math.max(1, 15 - feat.length))
                txt += `▢ ${feat} ${padding} [ *${status}* ] ${indicator}\n`
            }

            txt += `\n──────────────────────\n`
            txt += `💡 *Quick Action:* \`${prefix}${command} <name>\`\n`
            txt += `📝 *Example:* \`${prefix}${command} antilink\``

            await xp.sendMessage(id, { text: txt }, { quoted: m })
        }
    })
}
