/**
 * @module plugins/search/infoloker
 * @description MENCARI PEKERJAAN (Disnakerja)
 */

import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
   let page = text && !isNaN(text) ? text : '1'

   await m.reply(`💼 _Mencari lowongan kerja (Halaman ${page})..._`)

   try {
      const { data } = await axios.get(`https://api.denayrestapi.xyz/api/v1/search/disnaker?page=${page}`)

      if (data.status !== 200 || !data.result || data.result.data.length === 0) {
         return m.reply('❌ Info loker tidak ditemukan atau halaman kosong.')
      }

      const jobs = data.result.data
      let txt = `💼 *INFO LOKER DISNAKERJA* (Page ${page})
`
      txt += `━━━━━━━━━━━━━━━━━━━

`

      for (let j of jobs) {
         const meta = j.detail?.meta || {}

         txt += `🏢 *${j.title}*
`
         if (meta.lokasi) txt += `📍 ${meta.lokasi}
`
         if (meta.pendidikan) txt += `🎓 ${Array.isArray(meta.pendidikan) ? meta.pendidikan.join(', ').replace(/:/g, '').trim() : meta.pendidikan.replace(/:/g, '').trim()}
`
         if (meta.tipe_pekerjaan) txt += `💼 ${meta.tipe_pekerjaan.replace(/:/g, '').trim()}
`
         if (meta.last_update) txt += `📅 Update: ${meta.last_update}
`
         txt += `🔗 ${j.url}

`
      }

      txt += `_Ketik ${usedPrefix + command} ${parseInt(page) + 1} untuk halaman selanjutnya_`

      await m.reply(txt)

   } catch (e) {
      console.error('Loker Error:', e)
      m.reply('❌ Terjadi kesalahan saat mencari loker.')
   }
}

handler.help = ['infoloker [page]']
handler.tags = ['search', 'info']
handler.command = ['infoloker', 'disnaker']
handler.prefix = true

export default handler