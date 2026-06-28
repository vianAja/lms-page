pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
                sh 'docker compose down'
                sh 'docker compose up -d'
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
