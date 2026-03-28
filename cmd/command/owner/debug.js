import { Inventory } from '../../../system/inventory.js'
import { getGc } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'debug',
        cmd: ['debug', 'cekstatus', 'meinfo'],
        tags: 'Owner Menu',
        desc: 'Cek status debug user & grup',
        run: async (xp, m, { args, chat, isOwner, isAdmin, isBotAdmin, isGroup }) => {
            const sender = m.sender
            const senderNum = sender.split('@')[0]
            
            const owners = global.ownerNumber || []
            const realOwner = owners.map(n => n.replace(/[^0-9]/g, '')).includes(senderNum)
            
            const gcData = isGroup ? getGc(m.chat) : null
            const user = Inventory.getUser(sender)
            
            let txt = `🕵️ *DEBUG INFO* 🕵️\n\n`
            txt += `👤 *USER INFO*\n`
            txt += `JID Raw: ${m.key.participant || m.key.remoteJid}\n`
            txt += `JID Norm: ${sender}\n`
            txt += `Number: ${senderNum}\n`
            txt += `Is Owner (Middleware): ${isOwner}\n`
            txt += `Is Owner (Real Check): ${realOwner}\n`
            txt += `Is Admin: ${isAdmin}\n`
            txt += `Registered: ${user ? 'Yes' : 'No'}\n`
            txt += `Banned: ${user?.ban || false}\n`
            
            if (isGroup) {
                txt += `\n👥 *GROUP INFO*\n`
                txt += `ID: ${m.chat}\n`
                txt += `Is Bot Admin: ${isBotAdmin}\n`
                txt += `Mute Status: ${gcData?.mute || false}\n`
                txt += `Ban Status: ${gcData?.ban || false}\n`
            }
            
            m.reply(txt)
        }
    })
}
