pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Clean Up') {
            steps {
                // Hapus paksa container dengan nama yang bentrok
                sh 'docker rm -f lms-db lms-app || true'
                
                // Hapus docker-compose lama beserta volume-nya secara bersih
                sh 'docker compose down -v || true'
            }
        }
        
        stage('Setup Environment') {
            steps {
                // Mengambil file credentials dengan ID lms-cred dan menyalinnya ke workspace sebagai .env
                withCredentials([file(credentialsId: 'lms-cred', variable: 'SECRET_ENV')]) {
                    sh 'cp $SECRET_ENV .env'
                }
            }
        }

        stage('Build & Deploy') {
            steps {
                // Build images dan restart containers (LMS App + PostgreSQL)
                sh 'docker compose build'
                sh 'docker compose up -d db'
                
                // Tunggu sebentar agar PostgreSQL siap menerima koneksi
                sh 'sleep 8'
                
                // Jalankan container aplikasi
                sh 'docker compose up -d'
                
                // Tunggu sebentar agar app container selesai start
                sh 'sleep 5'
            }
        }

        stage('Database Migration') {
            steps {
                // Urutan wajib:
                // 1. seed.js    → CREATE TABLE dasar (users, lab_sessions, lab_access) + insert admin
                // 2. migrate.js → ALTER TABLE (tambah kolom) + buat UNIQUE constraint baru
                // 3. seed-v2.js → Insert/update semua labs & lab_sessions untuk semua user
                sh 'docker exec lms-app node src/lib/seed.js'
                sh 'docker exec lms-app node src/lib/migrate.js'
                sh 'docker exec lms-app node src/lib/seed-v2.js'
            }
        }
    }

    post {
        always {
            // Hapus file .env dari workspace untuk keamanan setelah deployment
            sh 'rm -f .env'
            
            // Bersihkan image yang dangling agar disk tidak penuh
            sh 'docker image prune -f'
        }
    }
}
