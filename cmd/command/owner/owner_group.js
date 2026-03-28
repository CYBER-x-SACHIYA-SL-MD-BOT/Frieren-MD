import { db, saveDb } from '../../../system/db/data.js'

export default function ownerGroup(ev) {
  ev.on({
    name: 'listgc',
    cmd: ['listgc', 'listgroup', 'grouplist'],
    tags: 'Owner Menu',
    desc: 'melihat daftar grup bot',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
          await xp.sendMessage(chat.id, { react: { text: '📋', key: m.key } })
          const groups = await xp.groupFetchAllParticipating()
          const list = Object.values(groups)
          
          if (!list.length) return m.reply('Bot belum bergabung ke grup manapun.')

          let txt = `📋 *DAFTAR GRUP FRIEREN-MD* 📋\n`
          txt += `Total: ${list.length} Grup Terdeteksi\n`
          txt += `━━━━━━━━━━━━━━━━━━━━\n\n`
          
          const botJid = xp.decodeJid(xp.user?.id)
          
          list.forEach((g, i) => {
              const participants = g.participants || []
              let isBotAdmin = false
              let ownerNum = 'Unknown'

              for (const p of participants) {
                  const pJid = xp.decodeJid(p.id)
                  if (pJid === botJid) {
                      isBotAdmin = (p.admin === 'admin' || p.admin === 'superadmin')
                  }
                  if (p.admin === 'superadmin') {
                      ownerNum = pJid.split('@')[0]
                  }
              }
              
              if (ownerNum === 'Unknown' && g.owner) ownerNum = g.owner.split('@')[0]
              
              const creation = g.creation 
                ? new Date(g.creation * 1000).toLocaleDateString('id-ID')
                : '?'

              txt += `${i + 1}. *${g.subject.substring(0, 25)}*\n`
              txt += `   🆔 \`${g.id}\`\n`
              txt += `   👥 Member: ${participants.length} | 🗓️ In: ${creation}\n`
              txt += `   👑 Owner: ${ownerNum} | 👮 Admin: ${isBotAdmin ? '✅' : '❌'}\n\n`
          })

          txt += `━━━━━━━━━━━━━━━━━━━━\n`
          txt += `_Gunakan .infogc di dalam grup untuk info detail._`

          await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
          console.error('error pada listgc', e)
          m.reply('❌ Gagal mengambil daftar grup: ' + e.message)
      }
    }
  })

  ev.on({
    name: 'creategroup',
    cmd: ['creategroup', 'buatgrup', 'newgc'],
    tags: 'Owner Menu',
    desc: 'Membuat grup baru via bot',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat }) => {
        const name = args.join(" ")
        if (!name) return m.reply("Masukkan nama grup! Contoh: .buatgrup Pasukan Berani Mati")
        
        try {
            const res = await xp.groupCreate(name, [m.sender])
            m.reply(`✅ Sukses membuat grup: *${name}*\nID: ${res.id}`)
        } catch (e) {
            console.error(e)
            m.reply("Gagal membuat grup. Pastikan nomor valid.")
        }
    }
  })

  ev.on({
    name: 'joingroup',
    cmd: ['join', 'joingrup', 'joingc', 'masukgrup'],
    tags: 'Main Menu',
    desc: 'Memasukkan bot ke grup via link (Menunggu persetujuan Owner)',
    run: async (xp, m, { args, chat, isOwner }) => {
        const link = args[0]
        if (!link) return m.reply("Kirim link grup WhatsApp untuk mengundang bot.")
        
        try {
            const url = new URL(link);
            const code = url.pathname.split('/').pop();
            if (!code) return m.reply("Link tidak valid!");

            const res = await xp.groupGetInviteInfo(code);
            
            if (isOwner) {
                await xp.groupAcceptInvite(code);
                await m.reply(`✅ Berhasil bergabung ke grup: *${res.subject}*`);
                return;
            }

            const ownerJid = global.ownerNumber[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const userNum = m.sender.split('@')[0];
            
            const reqText = `📩 *PERMINTAAN JOIN GRUP* 📩
            
👥 *Grup:* ${res.subject}
👤 *Pengundang:* @${userNum}
📅 *Dibuat:* ${new Date(res.creation * 1000).toLocaleDateString()}
🔗 *Link:* ${link}

_Balas pesan ini dengan .accjoin ${link} untuk menerima._`

            await xp.sendMessage(ownerJid, { text: reqText, mentions: [m.sender] });
            
            m.reply(`✅ *Permintaan Terkirim!*
            
Bot telah menyampaikan undangan Anda ke Owner.
Mohon tunggu persetujuan Owner untuk bot masuk ke grup *${res.subject}*.`);

        } catch (e) {
            console.error('Error joining group:', e);
            m.reply("Gagal memproses link. Pastikan link valid dan tidak kadaluarsa.");
        }
    }
  })

  ev.on({
      name: 'accjoin',
      cmd: ['accjoin', 'terimajoin'],
      tags: 'Owner Menu',
      desc: 'Menerima permintaan join grup',
      owner: true,
      run: async (xp, m, { args }) => {
          const link = args[0]
          if (!link) return m.reply('Mana link-nya?')
          
          try {
              const url = new URL(link);
              const code = url.pathname.split('/').pop();
              const res_gid = await xp.groupAcceptInvite(code);
              
              m.reply(`✅ Sukses join grup ID: ${res_gid}`);
              
              await xp.sendMessage(res_gid, { 
                  text: '👋 Halo semuanya! Saya FRIEREN.\nTerima kasih Owner telah mengizinkan saya bergabung.\nKetik *.menu* untuk memulai.' 
              });
          } catch (e) {
              m.reply('Gagal join. Link mungkin expired/revoke.')
          }
      }
  })

  ev.on({
    name: 'leavegroup',
    cmd: ['leave', 'out', 'keluar'],
    tags: 'Owner Menu',
    desc: 'Mengeluarkan bot dari grup saat ini',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { chat }) => {
        if (!chat.group) return m.reply("❌ Perintah ini hanya bisa digunakan di dalam grup.")
        try {
            await m.reply("👋 Selamat tinggal semuanya! Bot akan keluar...")
            await new Promise(r => setTimeout(r, 1000))
            await xp.groupLeave(chat.id)
        } catch (e) {
            console.error(e)
            m.reply("Gagal keluar grup.")
        }
    }
  })

  ev.on({
    name: 'remoteleave',
    cmd: ['leavegc', 'outgc', 'keluargc'],
    tags: 'Owner Menu',
    desc: 'Mengeluarkan bot dari grup tertentu (via ID/Link)',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args }) => {
        const input = args[0]
        if (!input) return m.reply("❌ Masukkan ID grup atau Link grup.\nContoh: .leavegc 12345@g.us")
        
        try {
            let targetId = input
            
            if (input.includes('chat.whatsapp.com')) {
                const url = new URL(input)
                const code = url.pathname.split('/').pop()
                if (code) {
                    const res = await xp.groupGetInviteInfo(code)
                    targetId = res.id
                    await m.reply(`🔍 Link terdeteksi: *${res.subject}*\nID: ${res.id}\n\nSedang memproses keluar...`)
                }
            }
            
            await xp.groupLeave(targetId)
            m.reply("✅ Sukses! Bot telah keluar dari grup tersebut.")
        } catch (e) {
            console.error(e)
            m.reply("❌ Gagal. Pastikan ID/Link benar atau bot masih berada di grup tersebut.")
        }
    }
  })

  ev.on({
    name: 'cleargc',
    cmd: ['cleargc', 'leaveall', 'bersihgrup'],
    tags: 'Owner Menu',
    desc: 'Keluar dari semua grup yang tidak ada ownernya',
    owner: !0,
    run: async (xp, m, { chat }) => {
        try {
            const groups = await xp.groupFetchAllParticipating()
            const list = Object.values(groups)
            
            if (list.length === 0) return m.reply('Bot belum masuk grup manapun.')
            
            m.reply(`⏳ Memeriksa ${list.length} grup...`)
            
            let leftCount = 0
            const ownerNums = global.ownerNumber.map(n => n.replace(/\D/g, ''))

            for (const g of list) {
                // Get participant numbers only
                const participants = g.participants.map(p => (p.id || p.jid).split('@')[0])
                const hasOwner = participants.some(p => ownerNums.includes(p))

                // Also check the specific 'owner' field from metadata if participants list is incomplete
                const groupOwner = g.owner ? g.owner.split('@')[0] : null
                const isOwnerInMeta = groupOwner && ownerNums.includes(groupOwner)

                if (!hasOwner && !isOwnerInMeta) {
                    await xp.sendMessage(g.id, { text: '⚠️ *AUTO LEAVE*\nOwner tidak terdeteksi di grup ini. Bot akan keluar otomatis demi keamanan.' })
                    await new Promise(r => setTimeout(r, 1000))
                    await xp.groupLeave(g.id)
                    leftCount++
                }
            }
            
            m.reply(`✅ Selesai!\nBot telah keluar dari *${leftCount}* grup tanpa owner.`)
            
        } catch (e) {
            console.error('cleargc error:', e)
            m.reply('Terjadi kesalahan saat membersihkan grup.')
        }
    }
  })
}