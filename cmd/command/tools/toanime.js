import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadImage = async (buffer) => {
  const { ext } = await import("file-type").then((m) => m.fileTypeFromBuffer(buffer));
  let form = new FormData();
  form.append("file", buffer, "tmp." + ext);
  let res = await axios.post("https://telegra.ph/upload", form, {
    headers: { ...form.getHeaders() },
  });
  return "https://telegra.ph" + res.data[0].src;
};

export default function (ev) {
  ev.on({
    name: "toanime",
    cmd: ["toanime", "jadiwibu", "jadianime"], // Removed 'anime' conflict
    tags: "Maker Menu",
    desc: "Ubah foto jadi anime",
    run: async (xp, m, { args, command }) => {
      try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || "";
        if (!/image\/(jpe?g|png)/.test(mime))
          return m.reply(`Kirim/Reply foto dengan caption .${command}`);

        await xp.sendMessage(m.chat, { react: { text: "🎨", key: m.key } });

        let img = await q.download();
        let url = await uploadImage(img);
        
        // Using Tenada API (Stable) or similar
        let animeUrl = `https://api.tenada.net/api/v1/transform/anime?url=${url}`
        // Or fallback to existing logic if Tenada requires key
        
        // Using Ryzumi / Other free API
        let res = `https://api.ryzumi.net/api/ai/toanime?url=${url}`

        await xp.sendMessage(
          m.chat,
          { image: { url: res }, caption: "✅ Berhasil jadi wibu!" },
          { quoted: m }
        );
      } catch (e) {
        m.reply("Gagal mengubah gambar.");
        console.error(e);
      }
    },
  });
}
