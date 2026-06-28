# Lab Linux 1 — Membuat Folder, File & Menulis File

> **Tujuan:** Setelah menyelesaikan lab ini, kamu akan mampu membuat direktori, membuat file, dan menulis konten ke dalam file menggunakan terminal Linux.

---

## 🗂️ Konsep Dasar

Di Linux, semua komponen sistem — mulai dari konfigurasi, log, hingga program — tersimpan sebagai **file** di dalam hierarki **direktori**. Kemampuan menavigasi dan memanipulasi file lewat terminal adalah keahlian fundamental seorang DevOps Engineer.

---

## 📁 Bagian 1 — Membuat Direktori

### `mkdir` — Make Directory

Perintah `mkdir` digunakan untuk membuat satu atau lebih direktori baru.

```bash
mkdir my-project
```

Untuk membuat beberapa direktori sekaligus (termasuk subdirektori yang belum ada), gunakan flag `-p`:

```bash
mkdir -p my-project/src/components
```

**Verifikasi:**
```bash
ls -la my-project/
```

Output yang diharapkan:
```
total 0
drwxr-xr-x 3 labuser labuser 26 Jun 28 09:00 .
drwxr-xr-x 6 labuser labuser 74 Jun 28 09:00 ..
drwxr-xr-x 3 labuser labuser 22 Jun 28 09:00 src
```

---

## 📄 Bagian 2 — Membuat File Kosong

### `touch` — Create Empty File

Perintah `touch` membuat file kosong atau memperbarui timestamp file yang sudah ada.

```bash
touch my-project/README.md
touch my-project/src/index.js
```

Cek hasilnya:
```bash
ls -l my-project/
ls -l my-project/src/
```

---

## ✏️ Bagian 3 — Menulis Konten ke File

### Metode 1: Operator `>` (Overwrite)

Operator `>` mengarahkan output dari sebuah perintah ke dalam file. Jika file sudah ada, isinya akan **ditimpa (overwrite)**.

```bash
echo "# My Project" > my-project/README.md
echo "console.log('Hello, Linux!');" > my-project/src/index.js
```

### Metode 2: Operator `>>` (Append)

Operator `>>` **menambahkan** konten ke akhir file tanpa menghapus isi sebelumnya.

```bash
echo "" >> my-project/README.md
echo "Proyek latihan dasar Linux." >> my-project/README.md
echo "Dibuat pada: $(date)" >> my-project/README.md
```

### Metode 3: `cat` dengan Heredoc

Untuk menulis beberapa baris sekaligus secara interaktif:

```bash
cat > my-project/notes.txt << 'EOF'
Catatan Penting:
- Gunakan mkdir untuk membuat folder
- Gunakan touch untuk membuat file kosong
- Gunakan echo > untuk menulis ke file
- Gunakan cat untuk membaca file
EOF
```

---

## 👁️ Bagian 4 — Membaca Isi File

### `cat` — Concatenate & Display

```bash
cat my-project/README.md
```

### `less` — Interactive Reader

```bash
less my-project/notes.txt
# Tekan 'q' untuk keluar
```

### `head` dan `tail`

```bash
head -5 my-project/README.md   # 5 baris pertama
tail -5 my-project/README.md   # 5 baris terakhir
```

---

## 🧪 Latihan Mandiri

Coba kerjakan perintah berikut secara berurutan:

```bash
# 1. Buat struktur direktori proyek
mkdir -p ~/devops-lab/{config,logs,scripts}

# 2. Buat file konfigurasi
touch ~/devops-lab/config/app.env

# 3. Isi file konfigurasi
echo "APP_ENV=development" > ~/devops-lab/config/app.env
echo "PORT=8080" >> ~/devops-lab/config/app.env
echo "LOG_LEVEL=debug" >> ~/devops-lab/config/app.env

# 4. Buat log entry pertama
echo "[$(date)] Server started" > ~/devops-lab/logs/app.log

# 5. Verifikasi semua file
cat ~/devops-lab/config/app.env
cat ~/devops-lab/logs/app.log
find ~/devops-lab -type f
```

---

## ✅ Kriteria Keberhasilan

Pastikan kamu sudah bisa:

| Tugas | Perintah |
|-------|----------|
| Membuat direktori | `mkdir`, `mkdir -p` |
| Membuat file kosong | `touch` |
| Menulis ke file | `echo >`, `echo >>` |
| Menulis multiline | `cat << 'EOF'` |
| Membaca isi file | `cat`, `less`, `head`, `tail` |
| Melihat struktur direktori | `ls -la`, `find`, `tree` |

> 💡 **Tips:** Gunakan `Tab` untuk auto-complete nama file/direktori dan hemat waktu mengetik!
