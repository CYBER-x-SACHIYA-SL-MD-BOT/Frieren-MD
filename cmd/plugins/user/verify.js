/**
 * @module plugins/user/verify
 * @description Registration & Verification System (Unified)
 */

import { randomBytes } from 'crypto'
import { db, saveDb } from '#system/db/data.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const mono = (t) => '`' + t + '`'
const toRupiah = (angka) => 'Rp ' + (typeof angka === 'number' ? angka : parseInt(angka)).toLocaleString('id-ID')
const makeSn = (length) => randomBytes(length).toString('hex').slice(0, length).toUpperCase()

let handler = async (m, { conn, text, args, command, usedPrefix }) => {
    const user = db().key[m.sender]
    if (!user) return m.reply('❌ Error: User data not found.')

    if (user.registered) {
        return m.reply(`⚠️ Anda sudah terdaftar. Gunakan ${mono(usedPrefix + 'unreg')} untuk daftar ulang.`)
    }

    // --- CASE 1: MANUAL REGISTER (.daftar Nama.Umur.Gender) ---
    if (command === 'daftar' || command === 'reg' || command === 'register') {
        if (!text) {
            return m.reply(`${mono('VERIFIKASI MANUAL')}\n\nSilakan daftar dengan format:\n${mono(usedPrefix + command + ' Nama.Umur.Gender')}\n\nContoh: ${mono(usedPrefix + command + ' Budi.18.Pria')}\n\nAtau ketik ${mono(usedPrefix + 'verify')} untuk verifikasi interaktif.`)
        }

        let nama, umur, gender
        if (text.toLowerCase() === 'auto') {
            nama = m.pushName || 'User'
            umur = Math.floor(Math.random() * 12) + 18
            gender = '-'
        } else {
            if (!text.includes('.')) return m.reply(`⚠️ Format salah. Gunakan titik (.) sebagai pemisah.\nContoh: ${mono('.daftar Budi.18.Pria')}`)
            ;[nama, umur, gender] = text.split('.')
        }

        if (!nama || !umur || !gender) return m.reply('❌ Data tidak lengkap. Format: Nama.Umur.Gender')
        umur = parseInt(umur)
        if (isNaN(umur) || umur < 5 || umur > 90) return m.reply('❌ Umur tidak valid (5-90).')

        return finalizeRegistration(m, { nama, umur, gender }, conn)
    }

    // --- CASE 2: INTERACTIVE VERIFY (.verify) ---
    if (command === 'verify' || command === 'v') {
        user.verifyStep = 'waitingAge'
        saveDb()
        return m.reply(`${mono('VERIFIKASI INTERAKTIF')}\n\nSilakan masukkan umur Anda.\nContoh: ${mono('18')}`)
    }
}

// --- BEFORE HOOK (FOR INTERACTIVE) ---
handler.before = async (m, { conn }) => {
    if (!m.text || m.text.startsWith('.') || m.text.startsWith('#') || m.text.startsWith('!')) return 
    
    const user = db().key[m.sender]
    if (!user || user.registered || !user.verifyStep) return

    // STEP 1: Handle Age Input
    if (user.verifyStep === 'waitingAge') {
        if (/^\d+$/.test(m.text)) {
            const age = parseInt(m.text)
            if (age < 5 || age > 90) return m.reply('❌ Umur tidak valid (5-90). Masukkan lagi:')
            
            user.tempAge = age
            user.verifyStep = 'waitingGender'
            saveDb()
            return m.reply(`${mono('Umur diterima.')}\n\nSelanjutnya, pilih gender:\nKetik *L* untuk Laki-laki\nKetik *P* untuk Perempuan`)
        }
    }

    // STEP 2: Handle Gender Input
    if (user.verifyStep === 'waitingGender') {
        const text = m.text.toLowerCase().trim()
        let gender = ''
        if (['l', 'laki', 'pria', 'cowok'].includes(text)) gender = 'Pria'
        else if (['p', 'perempuan', 'wanita', 'cewek'].includes(text)) gender = 'Wanita'
        else return m.reply('❌ Pilihan salah. Ketik *L* atau *P*:')

        const data = {
            nama: m.pushName || 'User',
            umur: user.tempAge,
            gender: gender
        }
        
        user.verifyStep = null
        delete user.tempAge
        return finalizeRegistration(m, data, conn)
    }
}

// --- CORE REGISTRATION LOGIC ---
async function finalizeRegistration(m, data, conn) {
    const user = db().key[m.sender]
    const bonusMoney = 200000
    const bonusLimit = 40
    const serial = makeSn(8)

    user.name = data.nama.trim()
    user.age = data.umur
    user.gender = data.gender
    user.registered = true
    user.regTime = Date.now()
    user.noId = serial
    
    user.money = (user.money || 0) + bonusMoney
    user.limit = (user.limit || 0) + bonusLimit
    
    saveDb()

    // Sync registered.json (Legacy Support)
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url))
        const regPath = path.join(__dirname, '../../../system/db/registered.json')
        let regData = []
        if (fs.existsSync(regPath)) regData = JSON.parse(fs.readFileSync(regPath, 'utf-8'))
        if (!regData.includes(m.sender)) {
            regData.push(m.sender)
            fs.writeFileSync(regPath, JSON.stringify(regData, null, 2))
        }
    } catch (e) {
        console.error('Error syncing registered.json:', e)
    }

    const msg = `╭───「 *REGISTRATION SUCCESS* 」
│
│ 👋 Halo, *${user.name}*
│ Data diri Anda telah diverifikasi!
│
│ 📋 *DATA PENGGUNA:*
│ ├ 👤 Nama: ${user.name}
│ ├ 🎗️ Umur: ${user.age} Tahun
│ ├ 🍃 Gender: ${user.gender}
│ └ 🔢 Serial: ${serial}
│
│ 🎁 *STARTER PACK:*
│ ├ 💰 Uang: *${toRupiah(bonusMoney)}*
│ └ ⚡ Limit: *+${bonusLimit}*
│
╰─────────────────────
Ketik .menu untuk memulai.`

    return m.reply(msg)
}

handler.help = ['daftar', 'verify']
handler.tags = ['Main Menu']
handler.command = ['daftar', 'register', 'reg', 'verify', 'v']
handler.prefix = true

export default handler
