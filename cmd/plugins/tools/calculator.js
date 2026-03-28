/**
 * @module plugins/tools/calculator
 * @description Calculator Tool (Anti-Cheat for Math Game)
 */

let handler = async (m, { conn, text }) => {
  let id = m.chat
  
  // Anti-Cheat: Jika sedang main game Math, matikan sesi jika pakai kalkulator
  conn.math = conn.math ? conn.math : {}
  if (id in conn.math) {
    clearTimeout(conn.math[id][3])
    delete conn.math[id]
    m.reply('🫣 Hmmm... Ketahuan ngecheat ya? Game dihentikan!')
    return
  }

  if (!text) return m.reply('🔢 Masukkan soal matematika.\nContoh: .calc 10*5+2')

  let val = text
    .replace(/[^0-9\-\/+*×÷πEe()piPI/]/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π|pi/gi, 'Math.PI')
    .replace(/e/gi, 'Math.E')
    .replace(/\/+/g, '/')
    .replace(/\++/g, '+')
    .replace(/-+/g, '-')
    
  let format = val
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/\//g, '÷')
    .replace(/\*×/g, '×')
    
  try {
    console.log('[CALC]', val)
    
    // Eval Secure-ish (Regex sanitized above)
    let result = (new Function('return ' + val))()
    
    if (result === undefined || isNaN(result)) throw new Error('Result NaN/Undefined')
    
    // Formatting Result
    let resStr = String(result)
    
    m.reply(`*${format}* = *${resStr}*`)
    
  } catch (e) {
    m.reply('❌ Format salah! Hanya angka 0-9 dan simbol -, +, *, /, ×, ÷, π, e, (, ) yang didukung.')
  }
}

handler.help = ['calc <expression>']
handler.tags = ['tools']
handler.command = ['calc', 'hitung']
handler.exp = 5
handler.prefix = true

export default handler