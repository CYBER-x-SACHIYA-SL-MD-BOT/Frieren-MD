/**
 * @module plugins/owner/debug_puasa
 * @description Debugging tool for AutoPuasa feature (Text Icons)
 */

import moment from 'moment-timezone'
import axios from 'axios'
import { db } from '#system/db/data.js'

let handler = async (m, { conn }) => {
    const chat = db().chats[m.chat] || {}
    if (!chat.autopuasa || !chat.autopuasa.status) {
        return m.reply(`[ ! ] AutoPuasa OFF di grup ini.\nAktifkan dengan: .autopuasa on`)
    }

    const city = chat.autopuasa.city || 'Pontianak'
    const now = moment().tz('Asia/Jakarta')
    
    let txt = `[ DEBUG AUTOPUASA ]\n\n`
    txt += `Location : ${city}\n`
    txt += `Server   : ${now.format('HH:mm:ss')}\n`
    txt += `Date     : ${now.format('YYYY-MM-DD')}\n`
    
    try {
        const { data } = await axios.get(`https://api.ryzumi.net/api/search/jadwal-sholat?kota=${encodeURIComponent(city)}`)
        
        if (!data.schedules || data.schedules.length === 0) {
            return m.reply(txt + `\n[ ! ] API Error: Kota tidak ditemukan.`)
        }

        const jadwal = data.schedules[0].jadwal
        const cleanTime = (t) => t ? t.substring(0, 5) : '??:??'

        const subuh = cleanTime(jadwal.subuh)
        const imsak = cleanTime(jadwal.imsak)
        const maghrib = cleanTime(jadwal.maghrib)
        
        const subuhM = moment.tz(`${now.format('YYYY-MM-DD')} ${subuh}`, "YYYY-MM-DD HH:mm", "Asia/Jakarta")
        const sahurM = subuhM.clone().subtract(90, 'minutes')
        const sahur = sahurM.format('HH:mm')
        
        const getDiff = (target) => {
            const t = moment.tz(`${now.format('YYYY-MM-DD')} ${target}`, "YYYY-MM-DD HH:mm", "Asia/Jakarta")
            return now.diff(t, 'minutes')
        }

        txt += `\n[ JADWAL & STATUS ]\n`
        txt += `-------------------\n`
        
        const check = (name, target) => {
            const d = getDiff(target)
            // Trigger 0-15 mins
            const status = (d >= 0 && d <= 15) ? '[ACTIVE]' : (d > 15 ? '[PASSED]' : '[WAITING]')
            return `> ${name.padEnd(6)}: ${target} (${d}m) -> ${status}`
        }
        
        txt += `${check('Sahur', sahur)}\n`
        txt += `${check('Imsak', imsak)}\n`
        txt += `${check('Subuh', subuh)}\n`
        txt += `${check('Buka', maghrib)}\n`
        
        txt += `-------------------\n`
        txt += `Trigger Range: 0 - 15 mins`

        m.reply(txt)

    } catch (e) {
        m.reply(txt + `\n[ ! ] Error: ${e.message}`)
    }
}

handler.command = ['debugpuasa']
handler.tags = ['owner']
handler.owner = true

export default handler