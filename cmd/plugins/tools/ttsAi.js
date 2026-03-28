/**
 * @module plugins/tools/ttsAi
 * @description TTS Ai 
 */

import axios from "axios"

const API = "https://api-faa.my.id/faa/tts-legkap"

let handler = async (m, { conn, text }) => {
  try {
    await m.react("⏳")

    // Help ketika lu ketik tts lihat baik baik cooo agar paham
    if (!text) {
      let { data } = await axios.get(`${API}?text=halo`)

      if (!data.status) throw "API error"

      let models = data.result
        .filter(v => !v.error && v.model)
        .map(v => `• ${v.model}`)
        .join("\n")

      return conn.reply(
        m.chat,
        `🎤 *Text To Speech*

📌 Cara Pakai:
${usedPrefix + command} {model} <teks>

Contoh:
${usedPrefix + command} goku Halo semuanya

📚 Daftar Model Tersedia:
${models}`,
        m
      )
    }

    let args = text.trim().split(" ")
    let model = args.shift().toLowerCase()
    let inputText = args.join(" ")

    if (!inputText) {
      return conn.reply(
        m.chat,
        "Masukkan teks yang ingin dijadikan suara.\n\nContoh:\n.tts nahida Halo dunia",
        m
      )
    }

    let { data } = await axios.get(
      `${API}?text=${encodeURIComponent(inputText)}`
    )

    if (!data.status || !data.result)
      throw "Response tidak valid"

    let voice = data.result.find(
      v => v.model?.toLowerCase() === model && v.url
    )

    if (!voice) {
      let models = data.result
        .filter(v => !v.error && v.model)
        .map(v => `• ${v.model}`)
        .join("\n")

      return conn.reply(
        m.chat,
        `❌ Model tidak ditemukan!

📚 Model tersedia:
${models}`,
        m
      )
    }

    let audio = await axios.get(voice.url, {
      responseType: "arraybuffer"
    })

    await conn.sendMessage(
      m.chat,
      {
        audio: Buffer.from(audio.data),
        mimetype: "audio/mpeg",
        ptt: true
      },
      { quoted: m }
    )

    await m.react("✅")

  } catch (err) {
    console.error("TTS ERROR:", err)
    await m.react("❌")
    conn.reply(
      m.chat,
      "Terjadi kesalahan saat membuat audio.\nCoba lagi nanti.",
      m
    )
  }
}

handler.help = ["ttsai <model> <teks>"]
handler.tags = ["tools"]
handler.command = ['ttsai', 'ttss', 'aitts']
handler.prefix = true

export default handler