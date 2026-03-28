import { ev } from './handle.js'

async function ocrs(xp, m) {
  try {
    const { text } = global.getMessageContent(m)
    if (!text) return false

    const [base, target, ...rest] = text.trim().split(/\s+/)
    if (!base || base.toLowerCase() !== 'set') return false

    // Logic set command similar to Dabi-Ai
    // Usually used for configuring bot features via image/text
    return false // Placeholder for more complex OCR/SET logic
  } catch (e) {
    return false
  }
}

export { ocrs }