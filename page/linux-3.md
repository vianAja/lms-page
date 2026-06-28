# Lab Linux 3 — Bash Scripting & Automation

> **Tujuan:** Setelah menyelesaikan lab ini, kamu akan mampu membuat script Bash sederhana, menggunakan variabel, statement kondisional (`if/else`), loop (`for`), serta mengotomatiskan tugas sistem dasar.

---

## 🗂️ Konsep Dasar

**Bash Script** adalah file teks berisi serangkaian perintah yang dieksekusi oleh shell Bash. Scripting memungkinkan kamu mengotomatiskan tugas berulang seperti backup, monitoring sistem, dan deployment aplikasi.

---

## 📄 Bagian 1 — Membuat Script Pertama

### Buat file script

```bash
mkdir -p ~/scripts
cd ~/scripts
touch backup.sh
```

### Tulis kode script dengan shebang (`#!/bin/bash`)

```bash
cat > backup.sh << 'EOF'
#!/bin/bash

# Konfigurasi
SOURCE_DIR="$HOME/devops-lab"
BACKUP_DIR="$HOME/backup"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).tar.gz"

echo "=== Memulai Proses Backup ==="

# Cek apakah source direktori ada
if [ -d "$SOURCE_DIR" ]; then
    # Buat direktori backup jika belum ada
    mkdir -p "$BACKUP_DIR"
    
    # Lakukan kompresi direktori
    tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$SOURCE_DIR" .
    
    echo "Backup berhasil disimpan di: $BACKUP_DIR/$BACKUP_FILE"
else
    echo "Error: Direktori sumber $SOURCE_DIR tidak ditemukan."
    exit 1
fi

echo "=== Backup Selesai ==="
EOF
```

---

## 🔑 Bagian 2 — Memberikan Executable Permission

Sebelum menjalankan script, berikan hak akses eksekusi:

```bash
chmod +x backup.sh
```

---

## 🚀 Bagian 3 — Menjalankan Script

### Buat direktori sumber latihan

```bash
mkdir -p ~/devops-lab
echo "Data penting 1" > ~/devops-lab/file1.txt
echo "Data penting 2" > ~/devops-lab/file2.txt
```

### Jalankan script

```bash
./backup.sh
```

Output yang diharapkan:
```
=== Memulai Proses Backup ===
Backup berhasil disimpan di: /home/labuser/backup/backup_20260628_130000.tar.gz
=== Backup Selesai ===
```

### Verifikasi file backup

```bash
ls -l ~/backup
```

---

## 🔄 Bagian 4 — Latihan Loop & Otomatisasi Log

### Buat script log monitor

```bash
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "=== System Monitoring ==="
for i in {1..3}
do
    echo "Pengecekan ke-$i pada: $(date)"
    echo "Free Memory:"
    free -h | grep "Mem:"
    echo "------------------------"
    sleep 2
done
EOF

chmod +x monitor.sh
./monitor.sh
```

---

## ✅ Kriteria Keberhasilan

| Tugas | Perintah |
|-------|----------|
| Membuat file script | `touch script.sh` |
| Memberikan execute permission | `chmod +x script.sh` |
| Menggunakan Variable | `$VAR_NAME` |
| Menggunakan `if/else` | `if [ -d dir ]; then` |
| Menggunakan `for` Loop | `for i in {1..3}` |
| Menjalankan script | `./script.sh` |
