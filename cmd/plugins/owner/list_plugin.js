/**
 * @module plugins/owner/list_plugin
 * @description List Plugin (Manual Style)
 */

import fs from 'fs'
import path from 'path'

let handler = async (m) => {
    const tiny = (t) => t.split('').map(c=>{
        const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};
        return m[c]||c
    }).join('')
    const pluginsDir = 'cmd/plugins'
    const categories = fs.readdirSync(pluginsDir).filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory())
    
    let txt = `╭───「 *${tiny('PLUGINS LIST')}* 」───\n`
    txt += `│\n`
    
    let total = 0
    for (const cat of categories) {
        const files = fs.readdirSync(path.join(pluginsDir, cat)).filter(f => f.endsWith('.js'))
        if (files.length > 0) {
            txt += `│ 📂 *${tiny(cat.toUpperCase())}* (${files.length})\n`
            txt += `│ ${files.map(f => f.replace('.js', '')).join(', ')}\n`
            txt += `│\n`
            total += files.length
        }
    }
    
    txt += `╰────────────────────\n`
    txt += `📊 Total: ${total} Plugins`
    m.reply(txt)
}

handler.help = ['listplugin']
handler.tags = ['owner']
handler.command = ['listplugin', 'plugins']
handler.owner = true
handler.prefix = true

export default handler