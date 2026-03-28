import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const reminderFile = path.join(dirname, 'db/reminders.json')

// Load Database Reminder
export const loadReminders = () => {
    if (!fs.existsSync(reminderFile)) {
        fs.writeFileSync(reminderFile, JSON.stringify([], null, 2))
        return []
    }
    try {
        return JSON.parse(fs.readFileSync(reminderFile))
    } catch {
        return []
    }
}

export const saveReminders = (data) => {
    fs.writeFileSync(reminderFile, JSON.stringify(data, null, 2))
}

// Tambah Reminder Baru
export const addReminder = (userId, chatId, message, duration) => {
    const reminders = loadReminders()
    const now = Date.now()
    
    const data = {
        id: `rem-${now}-${Math.floor(Math.random() * 1000)}`,
        userId,
        chatId,
        message,
        targetTime: now + duration,
        createdAt: now
    }
    
    reminders.push(data)
    saveReminders(reminders)
    return data
}

// Hapus Reminder
export const deleteReminder = (id) => {
    const reminders = loadReminders()
    const filtered = reminders.filter(r => r.id !== id)
    if (reminders.length === filtered.length) return false
    saveReminders(filtered)
    return true
}

// List Reminder User
export const getReminders = (userId) => {
    return loadReminders().filter(r => r.userId === userId)
}

// Hapus Semua Reminder User
export const clearReminders = (userId) => {
    const reminders = loadReminders()
    const filtered = reminders.filter(r => r.userId !== userId)
    saveReminders(filtered)
    return true
}

// Loop Checker (Dijalankan di index.js)
export const startReminderSystem = (xp) => {
    setInterval(async () => {
        const reminders = loadReminders()
        if (!reminders.length) return

        const now = Date.now()
        const activeReminders = []
        let updated = false

        for (const rem of reminders) {
            if (now >= rem.targetTime) {
                updated = true
                
                // Pesan Reminder Estetik
                const txt = `⏰ *R E M I N D E R* ⏰
                
👤 Untuk: @${rem.userId.split('@')[0]}
📝 Pesan:
"${rem.message}"

_Waktu pengingat telah tiba!_`

                try {
                    // Kirim Pesan (Text Only)
                    await xp.sendMessage(rem.chatId, { 
                        text: txt,
                        mentions: [rem.userId]
                    })

                } catch (e) {
                    console.error('Gagal mengirim reminder:', e)
                }
            } else {
                activeReminders.push(rem)
            }
        }

        if (updated) {
            saveReminders(activeReminders)
        }

    }, 5000) // Cek setiap 5 detik
}
