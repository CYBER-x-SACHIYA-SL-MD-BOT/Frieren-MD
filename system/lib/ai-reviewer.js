import { getGeminiClient } from "./gemini_helper.js";
import fs from "fs";
import 'dotenv/config';

async function review() {
  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Membaca file diff (perubahan kode) yang dihasilkan oleh GitHub Action
  if (!fs.existsSync("changes.diff")) {
    console.log("No changes.diff file found. Skip review.");
    return;
  }

  const diff = fs.readFileSync("changes.diff", "utf8");

  if (!diff || diff.trim().length < 10) {
    console.log("No significant changes to review.");
    return;
  }

  const prompt = `Anda adalah seorang Senior Software Engineer dan Pakar Keamanan Siber. 
Tugas Anda adalah meninjau perubahan kode (git diff) berikut pada proyek bot WhatsApp berbasis Node.js (Baileys).

Berikan ulasan singkat dan padat dalam Bahasa Indonesia mengenai:
1. Potensi Bug atau kesalahan logika.
2. Celah keamanan (seperti injeksi, kebocoran data).
3. Saran optimasi performa.

Gunakan format poin-poin dan berikan contoh kode jika perlu. 
Jika kode sudah sangat bagus, berikan pujian singkat.

Berikut adalah perubahannya:
\n\n${diff}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("\n--- 🤖 GEMINI AI CODE REVIEW ---\n");
    console.log(response.text());
    console.log("\n--------------------------------\n");
  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    process.exit(1);
  }
}

review();
