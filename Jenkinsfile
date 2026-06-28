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
                sh 'sleep 5'
                
                // Jalankan container aplikasi
                sh 'docker compose up -d'
                
                // Eksekusi migrasi dan seed database di dalam container lms-app
                // Penting untuk server baru agar tabel dan admin user otomatis dibuat
                sh 'docker exec lms-app node src/lib/migrate.js || true'
                sh 'docker exec lms-app node src/lib/seed-v2.js || true'
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
