import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { DisconnectReason } = require('@adiwajshing/baileys');
import c from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import connectToMongo from '../system/db/mongo.js'
import { syncWithMongo } from '../system/db/data.js'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const sessionPath = path.join(dirname, '../connect/session')

async function initReadline() {
  if (global.rl && !global.rl.closed) return
  const { createInterface } = await import('readline')
  global.rl = createInterface({ input: process.stdin, output: process.stdout })
  global.q = t => new Promise(r => global.rl.question(t, r))
}

const clearSessionAndRestart = async restart => {
  try {
    // HANYA hapus file creds.json, jangan hapus folder session
    // Ini trik agar tidak perlu scan QR ulang terus menerus jika cuma error kecil
    // Tapi jika Bad Session parah, terpaksa harus manual hapus
    console.log(c.yellowBright.bold('⚠️ Mencoba membersihkan cache session...'))
  } catch (e) {
    console.error(c.redBright.bold('Gagal hapus session:', e))
  }
  console.log(c.yellowBright.bold('Restarting in 5 seconds...'))
  setTimeout(restart, 5000) // Kasih jeda 5 detik agar panel tidak spam restart
}

const handleSessionIssue = async (msg, restart) => {
  console.error(c.redBright.bold('Session Critical Error:'), msg)
  
  if (!process.stdin.isTTY) {
      console.log(c.yellowBright.bold('Panel Mode: Auto-restarting...'))
      // Jangan langsung hapus session, coba restart dulu. 
      // Seringkali "Bad Session" itu false alarm karena koneksi panel yang jelek.
      setTimeout(restart, 10000) 
      return 
  }

  await initReadline()
  const ans = await global.q(c.yellowBright.bold('Hapus session & restart? (y/n): '))
  if (['y', 'ya'].includes(ans.toLowerCase())) {
     try {
        fs.rmSync(sessionPath, { recursive: true, force: true })
     } catch(e) {}
     restart()
  } else {
    process.exit(0)
  }
}

let retryCount = 0
const tryReconnect = async restart => {
  retryCount++
  console.log(c.yellowBright.bold(`Mencoba reconnect... (${retryCount})`))
  
  // Exponential Backoff: Semakin sering gagal, semakin lama nunggunya
  // Agar IP hosting tidak di-banned WhatsApp
  const delay = Math.min(retryCount * 2000, 30000) 
  
  setTimeout(restart, delay)
}

function evConnect(xp, restart) {
  xp.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const r = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.output?.payload?.message || ''
      console.log(c.redBright.bold(`Koneksi tertutup (${r}): ${reason}`))
      
      // RESET retry count jika errornya beda
      if (r !== 428 && r !== 515) retryCount = 0

      // Jika sedang dalam proses pairing, berikan delay ekstra
      if (xp.isPairing) {
        console.log(c.yellow('Koneksi terputus saat pairing. Menunggu 10 detik sebelum mencoba lagi...'))
        return setTimeout(restart, 10000)
      }

      switch (r) {
        case DisconnectReason.badSession:
          // Sering terjadi false alarm di panel. Jangan langsung hapus.
          console.log(c.red('Bad Session terdeteksi. Mencoba restart tanpa hapus sesi...'))
          return setTimeout(restart, 5000)

        case DisconnectReason.loggedOut:
          console.log(c.red('Perangkat logout. Silakan hapus folder session manual dan scan ulang.'))
          process.exit(1) // Matikan bot biar ketahuan
          break

        case 500: // Internal Server Error
        case 502: // Bad Gateway
        case 503: // Service Unavailable
        case 515: // Stream Error (Paling sering di panel gratisan)
          console.log(c.magentaBright.bold('Masalah Koneksi Hosting/Panel (Error 5xx). Restarting...'))
          return tryReconnect(restart)

        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.timedOut:
        case 428: // Connection Closed
        case 408: // Timeout
          return tryReconnect(restart)
          
        default:
          console.log(c.yellowBright.bold(`Error tidak dikenal (${r}), restart...`))
          return tryReconnect(restart)
      }
    }
    
    if (connection === 'open') {
      console.log(c.greenBright.bold('✅ Terhubung Stabil'))
      retryCount = 0 // Reset counter
      xp.isPairing = false // Matikan flag pairing
      
      // Database connect
      connectToMongo().then(() => syncWithMongo()).catch(e => {})
    }
  })
}

export { evConnect, handleSessionIssue }