/**
 * @module system/group_scheduler
 * @description Auto Open/Close Group berdasarkan jadwal (Running every minute)
 */

import { getGc, saveGc, gc } from './db/data.js' // Menggunakan export gc() yang benar
import moment from 'moment-timezone'

export async function startGroupSchedule(xp) {
    console.log('✅ Group Scheduler Started')
    
    setInterval(async () => {
        try {
            const groups = gc()?.key || {}
            const now = moment().tz('Asia/Jakarta')
            const currentTime = now.format('HH:mm')
            
            for (const jid of Object.keys(groups)) {
                const data = groups[jid]
                if (!data || !data.staySchedule) continue

                const { close, open } = data.staySchedule
                if (!close || !open) continue

                // Cek status grup saat ini (dari Metadata atau Cache)
                // Kita perlu fetch metadata untuk tahu status 'announce'
                // Tapi fetch semua grup tiap menit itu berat & rawan ban.
                // Solusi: Hanya eksekusi PADA MENIT YANG TEPAT.
                
                let action = null
                
                if (currentTime === close) {
                    action = 'close'
                } else if (currentTime === open) {
                    action = 'open'
                }

                if (action) {
                    try {
                        // Cek metadata dulu untuk memastikan tidak spam
                        const meta = await xp.groupMetadata(jid)
                        const isClosed = meta.announce

                        if (action === 'close' && !isClosed) {
                            await xp.groupSettingUpdate(jid, 'announcement')
                            await xp.sendMessage(jid, { 
                                text: `🌙 *JAM MALAM AKTIF*

Sudah jam ${close} WIB, grup ditutup otomatis.
Buka kembali jam ${open} WIB.

_Selamat beristirahat!_` 
                            })
                        } else if (action === 'open' && isClosed) {
                            await xp.groupSettingUpdate(jid, 'not_announcement')
                            await xp.sendMessage(jid, { 
                                text: `☀️ *SELAMAT PAGI*

Sudah jam ${open} WIB, grup dibuka kembali.
Selamat beraktivitas!` 
                            })
                        }
                    } catch (e) {
                        console.error(`Gagal update grup ${jid}:`, e.message)
                    }
                }
            }
        } catch (e) {
            console.error('Group Scheduler Error:', e)
        }
    }, 60000) // Cek setiap 60 detik
}
