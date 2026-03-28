import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'

// Konfigurasi
const MAX_DAYS = 7 // Hapus backup lama setelah 7 hari
const TEMP_DIR = path.join(process.cwd(), 'temp') // Menggunakan folder temp project
const LAST_RUN_FILE = path.join(TEMP_DIR, 'last-backup.json')

// Helper: Hitung selisih hari
const daysBetween = (dateStr) => {
    const diff = new Date() - new Date(dateStr)
    return diff / (1000 * 60 * 60 * 24)
}

// Helper: Bersihkan backup lama
const cleanOldBackup = () => {
    if (!fs.existsSync(TEMP_DIR)) return

    const files = fs.readdirSync(TEMP_DIR)
    for (const file of files) {
        if (!file.endsWith('.zip')) continue

        const match = file.match(/(\d{4}-\d{2}-\d{2})/)
        if (!match) continue

        const fileDate = match[1]
        if (daysBetween(fileDate) > MAX_DAYS) {
            try {
                fs.unlinkSync(path.join(TEMP_DIR, file))
                console.log(`[AUTO BACKUP] Deleted old backup: ${file}`)
            } catch (e) {
                console.error(`[AUTO BACKUP] Failed to delete ${file}:`, e)
            }
        }
    }
}

// Helper: Cek apakah sudah backup hari ini
const alreadyBackupToday = (date) => {
    if (!fs.existsSync(LAST_RUN_FILE)) return false
    try {
        const last = JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf-8'))
        return last.date === date
    } catch {
        return false
    }
}

// Helper: Simpan status backup
const saveLastBackup = (date) => {
    fs.writeFileSync(LAST_RUN_FILE, JSON.stringify({ date }))
}

/**
 * Memulai Cron Job Auto Backup
 * @param {Object} conn - Koneksi Baileys
 */
export function startAutoBackup(conn) {
    // Cek setiap 1 menit (60000 ms)
    setInterval(async () => {
        const now = new Date()
        const hour = now.getHours()
        const minute = now.getMinutes()
        const date = now.toISOString().split('T')[0] // Format YYYY-MM-DD

        // 👉 Jalankan HANYA pada jam 00:00 dan jika belum dijalankan hari ini
        if (hour !== 0 || minute !== 0) return
        if (alreadyBackupToday(date)) return

        console.log('[AUTO BACKUP] Starting scheduled backup...')

        try {
            // Check connection status first
            if (!conn.ws || !conn.ws.isOpen) {
                console.log('[AUTO BACKUP] Skipped: Connection not open')
                return
            }

            // 1. Pastikan folder temp ada
            if (!fs.existsSync(TEMP_DIR)) {
                fs.mkdirSync(TEMP_DIR, { recursive: true })
            }

            // 2. Bersihkan file lama
            cleanOldBackup()

            // 3. Siapkan nama file
            // Hapus karakter aneh dari nama bot untuk nama file
            const cleanBotName = (global.botName || 'Bot').replace(/[^a-zA-Z0-9]/g, '')
            const backupName = `${cleanBotName}-Backup-${date}.zip`
            const backupPath = path.join(TEMP_DIR, backupName)

            // 4. Proses ZIP
            // Exclude folder berat seperti node_modules, .git, temp, dll.
            const exclude = [
                'node_modules/*',
                'temp/*',
                'tmp/*',
                '.git/*',
                'sessions/*',
                'session/*',
                '*.zip'
            ].map(v => `"${v}"`).join(' ')

            // Jalankan perintah zip via shell
            execSync(`zip -r "${backupPath}" . -x ${exclude}`)

            // 5. Kirim ke Owner
            // Mengambil nomor owner pertama dari array
            const ownerNum = Array.isArray(global.ownerNumber) ? global.ownerNumber[0] : global.ownerNumber
            if (ownerNum) {
                const ownerJid = ownerNum + '@s.whatsapp.net'
                
                await conn.sendMessage(ownerJid, {
                    document: fs.readFileSync(backupPath),
                    fileName: backupName,
                    mimetype: 'application/zip',
                    caption: `🗂️ *AUTO BACKUP HARIAN*\n\n📅 Tanggal: ${date}\n🕛 Waktu: 00:00\n🤖 Bot: ${global.botName}\n\n_File backup berhasil dibuat dan dikirim._`
                })

                console.log(`[AUTO BACKUP] Success sent to ${ownerJid}`)
                
                // 6. Tandai sudah backup hari ini
                saveLastBackup(date)
            } else {
                console.warn('[AUTO BACKUP] Owner number not configured properly!')
            }

        } catch (e) {
            console.error('[AUTO BACKUP ERROR]', e)
        }
    }, 60 * 1000)
}
