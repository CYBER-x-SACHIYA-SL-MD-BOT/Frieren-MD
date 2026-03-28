import axios from "axios";
import { createUrl } from "../../../system/apis.js";

export default function (ev) {
  ev.on({
    name: "bratblur",
    cmd: ["bratblur", "blurbrat"],
    tags: "Tools Menu",
    desc: "Membuat teks brat dengan efek blur",
    run: async (xp, m, { text, usedPrefix, command }) => {
      if (!text) {
        return m.reply(
          `*Brat Blur Generator*\n\nContoh penggunaan:\n${usedPrefix + command} Hidup Jokowi`
        );
      }

      try {
        await xp.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        const apiUrl = createUrl("zell", "/tools/bratblur", {
          q: text,
        });

        // Fetch to check if it returns JSON or Image Buffer
        const response = await axios.get(apiUrl, {
          responseType: "arraybuffer", // Get as buffer first
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        let imgData = response.data;

        // Check if response is JSON (error or url wrapper)
        try {
            const jsonString = Buffer.from(response.data).toString('utf-8');
            const json = JSON.parse(jsonString);
            // If we successfully parsed JSON, it might be an error or a wrapper
            if (json.status === false || json.error) {
                return m.reply(`❌ Gagal: ${json.message || 'Error dari API'}`);
            }
            if (json.url) {
                imgData = { url: json.url };
            }
        } catch (e) {
            // Not JSON, assume it's an image buffer
        }

        await xp.sendMessage(
          m.chat,
          {
            image: imgData,
            caption: `🎨 *Brat Blur*\n\n📝 *Teks:* ${text}`,
          },
          { quoted: m }
        );
      } catch (e) {
        console.error("Brat Blur Error:", e);
        m.reply("🚨 Terjadi kesalahan saat membuat brat blur.");
      }
    },
  });
}
