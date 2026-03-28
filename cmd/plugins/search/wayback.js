/**
 * @module plugins/internet/wayback
 * @description Check archived versions of websites via Wayback Machine API
 */

import axios from "axios";

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
   if (!text) {
      return m.reply(
         `🔍 Masukkan URL website untuk melihat versi lawasnya.\nContoh:\n*${usedPrefix + command}* google.com\n*${usedPrefix + command}* google.com 2010`
      );
   }

   let year = null;
   let urlParts = [];

   for (let arg of args) {
      if (!year && /^(19|20)\d{2}$/.test(arg)) {
         year = arg;
      } else {
         urlParts.push(arg);
      }
   }

   let url = urlParts.join("");

   if (!url) return m.reply("❌ Masukkan URL yang valid.");

   if (!/^https?:\/\//i.test(url)) {
      url = "http://" + url;
   }

   try {
      await m.reply(
         year
            ? `_Searching Wayback Machine (${year})..._`
            : `_Searching Wayback Machine (Latest)..._`
      );

      const apiUrl = `https://archive.org/wayback/available?url=${url}${year ? `&timestamp=${year}` : ""}`;
      const { data } = await axios.get(apiUrl);

      if (
         !data ||
         !data.archived_snapshots ||
         !data.archived_snapshots.closest
      ) {
         return m.reply(
            `❌ Tidak ada arsip ditemukan untuk *${url}* ${year ? `di tahun ${year}` : ""}.`
         );
      }

      const snapshot = data.archived_snapshots.closest;
      // Format timestamp: YYYYMMDDhhmmss -> YYYY-MM-DD
      const ts = snapshot.timestamp;
      const date = ts
         ? `${ts.substring(0, 4)}-${ts.substring(4, 6)}-${ts.substring(6, 8)}`
         : "Unknown Date";

      let caption = `🏛️ *WAYBACK MACHINE* 🏛️\n\n`;
      caption += `🌐 *URL:* ${data.url}\n`;
      caption += `📅 *Snapshot Terakhir:* ${date}\n`;
      caption += `🔗 *Link Arsip:* ${snapshot.url}\n\n`;
      caption += `_Gunakan link ini untuk melihat tampilan website pada tanggal tersebut._`;

      await m.reply(caption);
   } catch (e) {
      console.error(e);
      m.reply("❌ Terjadi kesalahan saat mengakses Wayback Machine.");
   }
};

handler.help = ["wayback <url> [tahun]", "archive <url> [tahun]"];
handler.tags = ["internet", "tools"];
handler.command = ["wayback", "archive", "wb"];
handler.prefix = true;

export default handler;