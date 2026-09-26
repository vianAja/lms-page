# Deployment LMS Page dan Firecracker

Dokumen ini menjelaskan deployment aplikasi `lms-page` pada VM Ubuntu melalui SSH alias `pg-vian`.

## Arsitektur deployment

- Aplikasi: Next.js 16 dengan custom HTTP server dan Socket.IO.
- Process manager: PM2.
- Port aplikasi: `3067`.
- Database: PostgreSQL melalui Docker Compose, container `lms-db`, port host `5432`.
- MicroVM: Firecracker dengan KVM host (`/dev/kvm`).
- Direktori aplikasi: `/root/workspace/lms-page`.

## Prasyarat VM

VM harus memiliki:

- Ubuntu 22.04 atau lebih baru.
- Akses root atau `sudo`.
- Docker Engine dan Docker Compose plugin.
- Hardware virtualization atau nested virtualization yang aktif.
- Device `/dev/kvm` dengan akses read/write.

Pengecekan:

```bash
ssh pg-vian
uname -a
docker --version
docker compose version
ls -l /dev/kvm
lsmod | grep kvm
[ -r /dev/kvm ] && [ -w /dev/kvm ] && echo "KVM OK" || echo "KVM FAIL"
```

## Deployment aplikasi

### 1. Sinkronkan source code

Jalankan dari workstation pada folder repository:

```powershell
scp -r ./* pg-vian:/root/workspace/lms-page/
```

Jangan menyalin `.env` production dari workstation. File tersebut dibuat langsung di VM.

### 2. Install runtime Node.js

Contoh berikut menggunakan Node.js 22:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs build-essential python3 make g++ pkg-config libsqlite3-dev
node --version
npm --version
```

### 3. Siapkan environment database

Buat `/root/workspace/lms-page/.env` dan isi dengan nilai production. Password database harus unik dan tidak menggunakan nilai contoh di repository:

```dotenv
DB_USER=lms_admin
DB_PASSWORD=ganti-dengan-password-kuat
DB_NAME=lms
DB_HOST=127.0.0.1
DB_PORT=5432
NODE_ENV=production
PORT=3067
```

Batasi permission:

```bash
chmod 600 /root/workspace/lms-page/.env
```

### 4. Jalankan PostgreSQL

```bash
cd /root/workspace/lms-page
docker compose up -d db
docker compose ps
```

Pastikan container `lms-db` sehat dan port `5432` listen sebelum menjalankan migration.

### 5. Install dependency, migration, dan build

```bash
cd /root/workspace/lms-page
npm ci
node src/lib/seed.js
node src/lib/migrate.js
npm run build
```

`seed.js` membuat akun contoh yang ada di source code. Ganti password akun tersebut sebelum aplikasi dipakai di production.

### 6. Jalankan dengan PM2

```bash
cd /root/workspace/lms-page
mkdir -p logs
npm install --global pm2
npm run pm2:start
pm2 save
pm2 startup systemd
```

Jalankan command `sudo` yang dicetak oleh `pm2 startup systemd`, kemudian:

```bash
pm2 save
pm2 status
pm2 logs lms-page
curl -I http://127.0.0.1:3067
```

Perintah update berikut digunakan untuk deployment berikutnya:

```bash
cd /root/workspace/lms-page
npm ci
npm run build
pm2 restart lms-page --update-env
pm2 save
```

## Setup Firecracker

### 1. Verifikasi KVM

Firecracker membutuhkan KVM dan akses read/write ke `/dev/kvm`.

```bash
test -e /dev/kvm
test -r /dev/kvm && test -w /dev/kvm
getent group kvm
```

Untuk menjalankan Firecracker sebagai user non-root, tambahkan user tersebut ke group `kvm` lalu login ulang:

```bash
usermod -aG kvm <firecracker-user>
```

Pada VM ini, gunakan `root` hanya untuk bootstrap. Untuk production, gunakan user dan UID/GID terpisah untuk setiap microVM.

### 2. Install binary Firecracker dan Jailer

Versi harus dipin agar deployment reproducible. Contoh di bawah memakai release `v1.17.0`; ganti nilainya setelah memeriksa release resmi terbaru.

```bash
export FC_VERSION=v1.17.0
export FC_ARCH=x86_64
mkdir -p /opt/firecracker/releases
cd /opt/firecracker/releases
curl -fL "https://github.com/firecracker-microvm/firecracker/releases/download/${FC_VERSION}/firecracker-${FC_VERSION}-${FC_ARCH}.tgz" -o firecracker.tgz
tar -xzf firecracker.tgz
install -m 0755 "release-${FC_VERSION}-${FC_ARCH}/firecracker-${FC_VERSION}-${FC_ARCH}" /usr/local/bin/firecracker
install -m 0755 "release-${FC_VERSION}-${FC_ARCH}/jailer-${FC_VERSION}-${FC_ARCH}" /usr/local/bin/jailer
firecracker --version
jailer --version
```

### 3. Siapkan layout resource

```bash
install -d -m 0750 /var/lib/firecracker/{kernels,rootfs,vm,logs}
install -d -m 0755 /etc/firecracker
```

Setiap microVM sebaiknya memiliki direktori resource sendiri dan tidak berbagi socket API, rootfs writable, atau UID/GID jail.

### 4. Siapkan kernel dan rootfs guest

Firecracker tidak menyediakan kernel/rootfs otomatis. Gunakan kernel Linux yang didukung dan rootfs ext4/squashfs dari pipeline image internal atau artifact resmi Firecracker untuk pengujian.

Contoh mengambil artifact CI terbaru untuk host `x86_64`:

```bash
cd /var/lib/firecracker
export S3=https://s3.amazonaws.com/spec.ccfc.min
export PREFIX=$(curl -fsSL "$S3?list-type=2&prefix=firecracker-ci/&delimiter=/" \
  | grep -oP '(?<=<Prefix>)firecracker-ci/[0-9]{8}-[^/]+/(?=</Prefix>)' \
  | sort | tail -1)
export KERNEL_KEY=$(curl -fsSL "$S3?list-type=2&prefix=${PREFIX}x86_64/vmlinux-" \
  | grep -oP "(?<=<Key>)${PREFIX}x86_64/vmlinux-[0-9]+\\.[0-9]+\\.[0-9]{1,3}(?=</Key>)" \
  | sort -V | tail -1)
curl -fL "$S3/$KERNEL_KEY" -o kernels/vmlinux
```

Untuk production, build rootfs sendiri, scan image, pin checksum, dan simpan image immutable. Artifact CI resmi ditujukan untuk demonstrasi/pengujian.

### 5. Jalankan Firecracker menggunakan Jailer

Jangan expose API socket Firecracker ke jaringan. Socket harus Unix socket dengan permission terbatas.

Contoh skeleton:

```bash
export VM_ID=lms-lab-001
export VM_UID=20001
export VM_GID=20001
install -d -o ${VM_UID} -g ${VM_GID} -m 0700 /var/lib/firecracker/vm/${VM_ID}

jailer \
  --id ${VM_ID} \
  --exec-file /usr/local/bin/firecracker \
  --chroot-base-dir /var/lib/firecracker/vm \
  --uid ${VM_UID} \
  --gid ${VM_GID} \
  -- \
  --api-sock /run/firecracker-${VM_ID}.sock \
  --config-file /etc/firecracker/${VM_ID}.json
```

Config minimal `/etc/firecracker/lms-lab-001.json`:

```json
{
  "boot-source": {
    "kernel_image_path": "/var/lib/firecracker/kernels/vmlinux",
    "boot_args": "console=ttyS0 reboot=k panic=1"
  },
  "drives": [
    {
      "drive_id": "rootfs",
      "path_on_host": "/var/lib/firecracker/rootfs/lms-lab.ext4",
      "is_root_device": true,
      "is_read_only": false
    }
  ],
  "machine-config": {
    "vcpu_count": 1,
    "mem_size_mib": 512
  }
}
```

Pastikan file konfigurasi dan image dapat dibaca oleh user microVM:

```bash
chown firecracker:firecracker /etc/firecracker/lms-lab-001.json
chmod 0640 /etc/firecracker/lms-lab-001.json
```

Smoke test tanpa network interface:

```bash
rm -f /run/firecracker/lms-lab-001.sock
runuser -u firecracker -- timeout -k 2s 8s \
  firecracker \
  --api-sock /run/firecracker/lms-lab-001.sock \
  --config-file /etc/firecracker/lms-lab-001.json \
  > /var/lib/firecracker/logs/lms-lab-001-test.log 2>&1 || true
grep -E 'Ubuntu 24.04|Guest-boot-time' /var/lib/firecracker/logs/lms-lab-001-test.log
rm -f /run/firecracker/lms-lab-001.sock
```

Smoke test ini sudah berhasil dijalankan pada `pg-vian`. Untuk workload production, jalankan proses melalui Jailer, gunakan UID/GID unik per VM, serta stage config dan resource di dalam jail sesuai layout Jailer.

Path yang diberikan ke Jailer harus dimiliki dan tidak writable oleh user tidak terpercaya. Terapkan resource limit CPU, memory, file size, dan I/O sesuai workload lab.

### 6. Network dan keamanan microVM

Network Firecracker membutuhkan TAP device dan konfigurasi forwarding/NAT di host. Batasi egress dengan nftables/iptables; minimal blokir metadata endpoint `169.254.169.254` dari interface `tap*`:

```bash
iptables-nft -I FORWARD -i tap+ -d 169.254.169.254 -j DROP
```

Jangan menjalankan lab guest dengan akses jaringan host tanpa filtering. Firecracker sendiri tidak melakukan filtering traffic guest.

## Operasional dan troubleshooting

```bash
pm2 status
pm2 logs lms-page --lines 100
docker compose logs -f db
docker compose ps
ss -ltnp | grep -E ':3067|:5432'
journalctl -u pm2-root -n 100 --no-pager
```

Masalah umum:

- `ECONNREFUSED 127.0.0.1:5432`: PostgreSQL container belum running atau `.env` tidak sesuai.
- `npm ci` gagal pada native module: pastikan `build-essential`, `python3`, `make`, dan `g++` sudah terpasang.
- Firecracker gagal dengan `Permission denied` pada `/dev/kvm`: perbaiki membership group `kvm` atau jalankan proses bootstrap sebagai root.
- Firecracker gagal dengan `Resource busy`: cek hypervisor lain yang sedang memakai KVM.
- Guest tidak bisa internet: cek TAP, forwarding, route guest, NAT, dan firewall host.

Saat ini aplikasi di VM listen pada `0.0.0.0:3067`; reverse proxy TLS/domain belum dikonfigurasi karena domain belum ditentukan.

## Backup

Backup database dan resource microVM secara terpisah. Jangan memasukkan `.env`, private key, password lab, atau image guest berisi secrets ke Git.

```bash
docker exec lms-db pg_dump -U lms_admin -d lms > /root/lms-$(date +%F).sql
```

Referensi resmi:

- Firecracker Getting Started: https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md
- Firecracker production host setup: https://github.com/firecracker-microvm/firecracker/blob/main/docs/prod-host-setup.md
- Firecracker releases: https://github.com/firecracker-microvm/firecracker/releases
