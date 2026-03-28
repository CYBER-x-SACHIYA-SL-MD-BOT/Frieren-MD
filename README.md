<!-- Header with Animation -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=280&section=header&text=FRIEREN%20MD&fontSize=80&animation=fadeIn&fontAlignY=35&desc=Advanced%20WhatsApp%20AI%20%26%20RPG%20Ecosystem&descAlignY=60&descFontSize=25" width="100%"/>
</p>

<!-- Dynamic Typing Animation -->
<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com/?font=Fira+Code&pause=1000&color=92E3A9&center=true&vCenter=true&width=500&lines=Your+Ageless+Digital+Companion;Interactive+AI+Assistant;Deep+RPG+V3+Adventure;Optimized+Modular+Architecture" alt="Typing SVG" />
  </a>
</p>

<!-- Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Version-3.1.0-92E3A9?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Maintained%3F-yes-92E3A9?style=for-the-badge" alt="Maintained">
</p>

---

## 🌿 The Mage's Journey: Frieren-MD

**Frieren-MD** adalah asisten digital canggih yang dirancang dengan filosofi "umur panjang" dan "efisiensi". Dibangun di atas arsitektur modular, bot ini menggabungkan kecerdasan buatan (AI) yang mendalam dengan ekosistem RPG yang kaya, memberikan pengalaman interaktif yang belum pernah ada sebelumnya di WhatsApp.

### ✨ Kenapa Memilih Frieren-MD?

- **Modular Architecture**: Mudah dimodifikasi dan dikembangkan oleh siapa saja.
- **Intelligent AI**: Didukung oleh logika AI yang fleksibel dan responsif.
- **RPG System V3**: Petualangan tanpa henti dengan sistem ekonomi, level, dan item.
- **Lightweight**: Dioptimalkan untuk berjalan lancar bahkan di server spesifikasi rendah.

---

## ⚔️ Arsitektur Sistem RPG V3

Sistem RPG telah dioptimalkan agar lebih responsif dan adiktif.

| Fitur             | Deskripsi                                                         |
| :---------------- | :---------------------------------------------------------------- |
| **Bounty Hunter** | Buru pemain dengan kriminalitas tinggi dan klaim hadiahnya.       |
| **Job System**    | Pilih peran sebagai Warrior, Thief, atau Farmer untuk bonus unik. |
| **Alchemy**       | Racik berbagai potion dan bahan langka untuk bertahan di Dungeon. |
| **Pet Companion** | Pelihara makhluk mistis yang akan membantumu dalam pertempuran.   |

---

## 🚀 Memulai Instalasi

Pastikan Anda telah menginstal **Node.js v18+** dan **Git** di sistem Anda.

### 🛠️ Langkah Cepat

```bash
# Clone repository
git clone https://github.com/Har404-err/frieren-md.git

# Masuk ke direktori
cd frieren-md

# Instal dependensi
npm install

# Jalankan bot
npm start
```

---

## 🏗️ Arsitektur & Alur Kerja

### 1. Sistem Dispatcher (Penerima Pesan)

Diagram ini menjelaskan bagaimana **Frieren-MD** memproses setiap pesan yang masuk.

```mermaid
sequenceDiagram
    participant U as "User"
    participant W as "WhatsApp Socket"
    participant B as "Frieren-MD Core"
    participant D as "Command Dispatcher"
    participant P as "Plugins / AI Engine"

    U->>W: Kirim Pesan (e.g. .menu)
    W->>B: Event "messages.upsert"
    B->>D: Validasi Prefix & Permission
    D->>P: Eksekusi Logika Perintah
    P-->>B: Return Response (Text/Media)
    B->>W: Kirim Balasan
    W->>U: Pesan Diterima
```

### 2. Siklus Petualangan RPG V3

Logika di balik sistem RPG yang memastikan permainan tetap seimbang.

```mermaid
graph LR
    A["Mulai Adventure"] --> B{"Cek Stamina"}
    B -- "Habis" --> C["Istirahat / Potion"]
    B -- "Tersedia" --> D["Generate Random Event"]
    D --> E{"Hasil Event"}
    E -- "Menang" --> F["Dapat EXP & Money"]
    E -- "Kalah" --> G["Pengurangan HP"]
    F --> H["Update Database"]
    G --> H
    H --> I["Selesai Turn"]
```

### 3. Struktur Proyek (Modular)

Pemisahan tanggung jawab antar komponen sistem.

```mermaid
graph TD
    A["WhatsApp Interface"] -->|Socket| B("Baileys Library")
    B --> C{"Dispatcher"}
    C -->|"AI Requests"| D["AI Engine / LLM"]
    C -->|"Game Logic"| E["RPG Engine V3"]
    C -->|"Utilities"| F["Tools & Search"]
    E --> G[("Database Local / Mongo")]
```

---

## 🚩 Melaporkan Masalah (Issues)

Jika Anda menemukan bug, error, atau memiliki saran fitur, silakan laporkan melalui halaman **[Issues](https://github.com/Har404-err/frieren-md/issues)** di GitHub. Kami akan sangat menghargai laporan yang detail agar masalah dapat segera diatasi.

---

## 🤝 Kontribusi & Dukungan

Kami sangat terbuka untuk kontribusi! Frieren-MD adalah proyek komunitas, dan bantuan Anda sangat berarti.

### 🍴 Cara Fork & Kustomisasi

1.  **Fork** repository ini ke akun GitHub Anda.
2.  **Clone** hasil fork Anda ke lokal.
3.  Lakukan perubahan atau tambahkan fitur baru.
4.  **Push** ke repository fork Anda.
5.  Ajukan **Pull Request** (PR) jika ingin fitur tersebut digabungkan ke repository utama.

### ✨ Dukung Proyek Ini

Jika Anda menyukai bot ini, pertimbangkan untuk memberikan **Star ⭐** pada repository ini sebagai bentuk dukungan!

---

## 👥 Developer & Tim

<p align="center">
  <a href="https://github.com/Har404-err">
    <img src="https://github-readme-stats.vercel.app/api?username=Har404-err&show_icons=true&theme=radical&rank_icon=github&count_private=true" alt="Developer Stats" />
  </a>
</p>

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=30&section=footer&fontSize=20" width="100%"/>
</p>
