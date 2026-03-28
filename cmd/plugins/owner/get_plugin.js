/**
 * @module plugins/owner/get_plugin
 * @description Mengambil source code dari file plugin
 */

import fs from "fs";
import path from "path";
import { style } from "#system/style.js";

let handler = async (m, { text, usedPrefix, command }) => {
   if (!text)
      return m.reply(
         `${style.key("Format")} ${style.val(usedPrefix + command + " <namafile>")}`
      );

   const filename = text.endsWith(".js") ? text : text + ".js";

   // Helper: Search recursively
   const findFile = dir => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
         const fullPath = path.join(dir, file);
         if (fs.statSync(fullPath).isDirectory()) {
            const found = findFile(fullPath);
            if (found) return found;
         } else if (file === filename) {
            return fullPath;
         }
      }
      return null;
   };

   const filePath = findFile("cmd/plugins");
   if (!filePath)
      return m.reply(`❌ File ${style.val(filename)} tidak ditemukan.`);

   try {
      const code = fs.readFileSync(filePath, "utf8");
      const date = new Date().toLocaleString("id-ID", {
         timeZone: "Asia/Jakarta"
      });

      const watermark = `/*
 * ───────────────────────────
 * 🟢  FRIEREN MD  -  SOURCE CODE
 * ───────────────────────────
 * 👤 Channel  : https://shorturl.at/ce5eX
 * 📅 Fetched  : ${date}
 * 📂 File     : ${filename}
 * ───────────────────────────
 */

`;
      m.reply(watermark + code);
   } catch (e) {
      m.reply(`❌ Gagal membaca file: ${e.message}`);
   }
};

handler.help = ["getplugin <nama>"];
handler.tags = ["owner"];
handler.command = ["getplugin", "gp"];
handler.owner = true;
handler.prefix = true;

export default handler;
