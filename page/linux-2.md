# Lab Linux 2 — Permissions & Ownership

> **Tujuan:** Setelah menyelesaikan lab ini, kamu akan memahami sistem permission Linux (read/write/execute), mengubah kepemilikan file, dan menerapkan permission yang aman menggunakan `chmod` dan `chown`.

---

## 🔐 Konsep Dasar

Setiap file dan direktori di Linux memiliki **tiga set permission** untuk tiga kelompok pengguna:

| Kelompok | Simbol | Deskripsi |
|----------|--------|-----------|
| **Owner** | `u` | Pemilik file |
| **Group** | `g` | Grup yang diasosiasikan |
| **Others** | `o` | Semua pengguna lain |

### Jenis Permission

| Permission | Simbol | Nilai Oktal | Deskripsi |
|-----------|--------|-------------|-----------|
| Read | `r` | 4 | Baca isi file / list direktori |
| Write | `w` | 2 | Modifikasi file / tambah/hapus di direktori |
| Execute | `x` | 1 | Jalankan file / masuk ke direktori |

---

## 👁️ Bagian 1 — Melihat Permission

### Lihat permission file dan direktori

```bash
ls -la ~/
```

Output contoh:
```
drwxr-xr-x  5 labuser labuser 4096 Jun 28 09:00 .
drwxr-xr-x 18 root    root    4096 Jun 28 08:55 ..
-rw-r--r--  1 labuser labuser  220 Jun 28 08:55 .bash_logout
-rw-r--r--  1 labuser labuser 3771 Jun 28 08:55 .bashrc
drwxr-xr-x  3 labuser labuser 4096 Jun 28 09:00 my-project
```

### Baca output `ls -la`

```
-rw-r--r--  1  labuser  labuser  3771  Jun 28  .bashrc
│└─┬─┘└─┬─┘  │  └──┬──┘ └──┬──┘
│  │    │    │    owner   group
│  │    │    hardlink count
│  │   others
│  group
owner
file type (- = file, d = dir, l = symlink)
```

### Gunakan `stat` untuk detail lengkap

```bash
stat my-project/README.md
```

---

## 🔧 Bagian 2 — Mengubah Permission dengan chmod

### Symbolic mode

```bash
# Tambah execute untuk owner
chmod u+x script.sh

# Hapus write untuk others
chmod o-w config.txt

# Set permission tepat untuk group
chmod g=rx logs/
```

### Octal mode

Setiap digit mewakili kombinasi r(4)+w(2)+x(1):

```bash
# rw-r--r-- (644) — file biasa
chmod 644 config.txt

# rwxr-xr-x (755) — executable/direktori
chmod 755 deploy.sh

# rwx------ (700) — private executable
chmod 700 secret.sh

# rw------- (600) — private file
chmod 600 ~/.ssh/id_rsa
```

### Tabel referensi cepat

| Oktal | Simbol | Use Case |
|-------|--------|----------|
| `777` | `rwxrwxrwx` | ⚠️ Full akses semua (hindari!) |
| `755` | `rwxr-xr-x` | Script/direktori publik |
| `644` | `rw-r--r--` | File konfigurasi |
| `600` | `rw-------` | SSH key, file rahasia |
| `700` | `rwx------` | Script privat |

### Praktik Langsung

```bash
# Buat file test
touch test-permission.sh
echo "#!/bin/bash" > test-permission.sh
echo "echo 'Hello World'" >> test-permission.sh

# Cek permission awal
ls -l test-permission.sh

# Tambah execute permission
chmod +x test-permission.sh
ls -l test-permission.sh

# Jalankan script
./test-permission.sh
```

---

## 👤 Bagian 3 — Mengubah Kepemilikan dengan chown

### Sintaks chown

```bash
chown [owner][:group] file
```

### Contoh penggunaan

```bash
# Ganti owner saja
sudo chown www-data file.txt

# Ganti owner dan group sekaligus
sudo chown www-data:www-data /var/www/html/

# Ganti group saja
sudo chown :developers project/

# Rekursif untuk direktori
sudo chown -R labuser:labuser ~/my-project/
```

### Gunakan chgrp untuk group saja

```bash
sudo chgrp developers /var/www/html/
```

---

## 🧩 Bagian 4 — Special Permissions

### SUID (Set User ID)

```bash
# File berjalan dengan permission pemilik, bukan yang menjalankan
chmod u+s program
# atau
chmod 4755 program
```

### SGID (Set Group ID)

```bash
# Direktori: file baru mewarisi group direktori
chmod g+s shared-dir/
# atau
chmod 2755 shared-dir/
```

### Sticky Bit

```bash
# Hanya owner yang bisa hapus file miliknya di direktori shared
chmod +t /tmp/shared/
# atau
chmod 1777 /tmp/shared/
```

Lihat `/tmp` sebagai contoh:
```bash
ls -ld /tmp
# drwxrwxrwt 15 root root ... /tmp
# 't' di akhir = sticky bit aktif
```

---

## 🧪 Latihan Mandiri

Buat simulasi environment web server dengan permission yang benar:

```bash
# 1. Buat struktur direktori
mkdir -p ~/webserver/{public,private,logs}

# 2. Buat file dengan konten
echo "<?php phpinfo(); ?>" > ~/webserver/public/index.php
echo "DB_PASSWORD=secret123" > ~/webserver/private/.env
touch ~/webserver/logs/access.log

# 3. Set permission yang tepat
chmod 755 ~/webserver/public/          # direktori publik
chmod 644 ~/webserver/public/index.php # file publik (bisa dibaca semua)
chmod 700 ~/webserver/private/         # direktori privat (hanya owner)
chmod 600 ~/webserver/private/.env     # file sensitif (hanya owner baca/tulis)
chmod 755 ~/webserver/logs/            # direktori log
chmod 644 ~/webserver/logs/access.log  # log bisa dibaca

# 4. Verifikasi semua permission
ls -la ~/webserver/
ls -la ~/webserver/public/
ls -la ~/webserver/private/
```

---

## ✅ Kriteria Keberhasilan

| Tugas | Perintah |
|-------|----------|
| Lihat permission | `ls -la`, `stat` |
| chmod symbolic | `chmod u+x`, `chmod g-w` |
| chmod octal | `chmod 755`, `chmod 644` |
| Ganti owner | `sudo chown user file` |
| Ganti group | `sudo chown :group file` |
| Rekursif | `chmod -R`, `chown -R` |
| Sticky bit | `chmod +t dir/` |

> 💡 **Tips:** SSH private key **harus** permission `600`. Jika terlalu terbuka, SSH akan menolak koneksi dengan error "Permissions too open"!
