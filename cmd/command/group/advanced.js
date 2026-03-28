import { db, saveDb, randomId } from '../../../system/db/data.js'

export default function(ev) {
    ev.on({
        name: 'regall',
        cmd: ['regall', 'registerall', 'scanmember'],
        tags: 'Group Menu',
        desc: 'Mendaftarkan semua member grup ke database bot',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { chat }) => {
            try {
                const metadata = await xp.groupMetadata(chat.id)
                const participants = metadata.participants
                const users = db().key
                let count = 0

                // Role List for AI
                const role = [
                  'Gak Kenal', 'Baru Kenal', 'Temen Biasa', 'Temen Ngobrol', 'Temen Lama',
                  'Temen Hangout', 'Temen Dekat', 'Sahabat', 'Pacar', 'Soulmate'
                ]

                m.reply(`⏳ Memindai ${participants.length} anggota...`)

                for (const p of participants) {
                    const jid = p.id
                    // Skip if invalid or bot itself
                    if (!jid.endsWith('@s.whatsapp.net')) continue

                    // Check if already registered (by checking values)
                    const exists = Object.values(users).some(u => u.jid === jid)

                    if (!exists) {
                        // Create unique key
                        let k = jid.split('@')[0]
                        let i = 1
                        while (users[k]) k = `${jid.split('@')[0]}_${i++}`

                        // Insert Default User Data
                        users[k] = {
                            jid: jid,
                            noId: randomId({ key: { participantAlt: jid } }), // Mock m object for randomId
                            ban: false,
                            registered: false,
                            cmd: 0,
                            limit: 50,
                            money: 200000,
                            invest: { active: false, amount: 0, dueDate: 0 },
                            crypto: { btc: 0, eth: 0, usdt: 0 },
                            level: 1,
                            exp: 0,
                            health: 100,
                            max_health: 100,
                            strength: 10,
                            defense: 10,
                            stamina: 100,
                            max_stamina: 100,
                            inventory: { potion: 0 },
                            rpg_assets: { sword: 0, armor: 0, pickaxe: 0, axe: 0, fishing_rod: 0 },
                            lastAdventure: 0,
                            lastHunt: 0,
                            lastMine: 0,
                            lastChop: 0,
                            jailExpired: 0,
                            ai: { jarvis: false, chat: 0, role: role[0] }
                        }
                        count++
                    }
                }

                if (count > 0) {
                    await saveDb()
                    m.reply(`✅ Berhasil mendaftarkan *${count}* anggota baru ke database.`)
                } else {
                    m.reply('✅ Semua anggota sudah terdaftar.')
                }

            } catch (e) {
                console.error('Regall Error:', e)
                m.reply('❌ Gagal mendaftarkan anggota.')
            }
        }
    })
    
    // --- GROUP MEMBER ADD MODE ---
    ev.on({
        name: 'group_add_mode',
        cmd: ['addmode', 'modeadd'],
        tags: 'Group Menu',
        desc: 'Atur siapa yang bisa menambahkan anggota (Admin/Semua)',
        group: true,
        admin: true,
        prefix: true,
        botAdmin: true,
        run: async (xp, m, { args, chat }) => {
            const mode = args[0]?.toLowerCase()
            // Baileys: 'announcement' (Admin only?) No, separate method.
            // groupMemberAddMode: 'all_member_add' | 'admin_add'
            
            if (!mode || !['admin', 'all', 'semua'].includes(mode)) {
                return m.reply(`❌ Format salah.
Gunakan: .addmode admin atau .addmode all`)
            }

            try {
                const setting = mode === 'admin' ? 'admin_add' : 'all_member_add'
                await xp.groupMemberAddMode(chat.id, setting)
                
                m.reply(`✅ Pengaturan berhasil diubah.
Sekarang *${mode === 'admin' ? 'Hanya Admin' : 'Semua Anggota'}* yang dapat menambahkan peserta baru.`)
            } catch (e) {
                console.error('Error addmode:', e)
                m.reply('❌ Gagal mengubah pengaturan. Fitur mungkin belum tersedia di wilayah ini.')
            }
        }
    })

    // --- GROUP JOIN APPROVAL MODE ---
    ev.on({
        name: 'group_join_mode',
        cmd: ['joinmode', 'approvemode', 'accmet'],
        tags: 'Group Menu',
        desc: 'Aktifkan/Nonaktifkan persetujuan admin untuk anggota baru',
        group: true,
        admin: true,
        prefix: true,
        botAdmin: true,
        run: async (xp, m, { args, chat }) => {
            const mode = args[0]?.toLowerCase()
            // Baileys: groupJoinApprovalMode: 'on' | 'off'
            
            if (!mode || !['on', 'off', 'aktif', 'mati'].includes(mode)) {
                return m.reply(`❌ Format salah.
Gunakan: .joinmode on atau .joinmode off`)
            }

            try {
                const setting = (mode === 'on' || mode === 'aktif') ? 'on' : 'off'
                await xp.groupJoinApprovalMode(chat.id, setting)
                
                m.reply(`✅ Fitur "Approve New Participants" berhasil *${setting === 'on' ? 'DIAKTIFKAN' : 'DIMATIKAN'}*.
${setting === 'on' ? 'Anggota baru harus disetujui admin.' : 'Anggota baru bisa langsung masuk.'}`)
            } catch (e) {
                console.error('Error joinmode:', e)
                m.reply('❌ Gagal mengubah pengaturan.')
            }
        }
    })

    // --- LEAVE GROUP ---
    ev.on({
        name: 'group_leave',
        cmd: ['leave', 'out', 'keluar', 'leavegc'],
        tags: 'Group Menu',
        desc: 'Perintah agar bot keluar dari grup',
        group: true,
        admin: true,
        prefix: true, 
        run: async (xp, m, { chat }) => {
            try {
                await m.reply('👋 Sampai jumpa! Bot akan keluar dari grup ini.')
                await new Promise(resolve => setTimeout(resolve, 2000)) // Delay biar pesan terkirim
                await xp.groupLeave(chat.id)
            } catch (e) {
                console.error('Error leave:', e)
                m.reply('❌ Gagal keluar dari grup.')
            }
        }
    })
}