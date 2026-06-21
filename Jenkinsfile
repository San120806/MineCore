pipeline {
    agent {
        label 'docker-executor'
    }

    options {
        // Enforce a maximum timeout for the entire run
        timeout(time: 30, unit: 'MINUTES')
        
        // Ensure console logs are decorated with colors (for Prettier/ESLint)
        ansiColor('xterm')
        
        // Prevent concurrent builds on the same branch to save resource limits
        disableConcurrentBuilds()
        
        // Keep build logs clean
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    tools {
        // Automatically inject NodeJS 20 runtime into the PATH (defined in Global Tools)
        nodejs 'NodeJS-20'
    }

    environment {
        // Global variables (defaults fallback to global envs if not set in UI)
        DOCKER_REGISTRY = "${env.DOCKER_REGISTRY ?: 'docker.io'}"
        DOCKER_USER     = "${env.DOCKER_USER ?: 'saniyakapure'}"
        
        // Named image targets
        BACKEND_IMAGE   = "${DOCKER_REGISTRY}/${DOCKER_USER}/minecore-backend"
        FRONTEND_IMAGE  = "${DOCKER_REGISTRY}/${DOCKER_USER}/minecore-frontend"
        
        // CI-specific database string (no actual connection is required during TSC build validation)
        DATABASE_URL    = "postgresql://ci_user:ci_pass@localhost:5432/ci_db?schema=public"
    }

    stages {
        stage('Checkout') {
            steps {
                // Fetch latest code from the git SCM checkout
                checkout scm
            }
        }

        stage('Static Code Analysis') {
            steps {
                script {
                    echo "--- DEVSECOPS PLACEHOLDER: SonarQube SAST Analysis ---"
                    echo "Future commands:"
                    echo "  withSonarQubeEnv('SonarQube') {"
                    echo "      sh 'sonar-scanner -Dsonar.projectKey=minecore ...'"
                    echo "  }"
                }
            }
        }

        stage('Parallel Validation') {
            parallel {
                stage('Frontend Validation') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npx prettier --check "src/**/*.{ts,tsx,css,json}"'
                            sh 'npm run lint'
                            sh 'npx tsc --noEmit'
                            sh 'npm run build'
                        }
                    }
                }

                stage('Backend Validation') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npx prisma validate'
                            sh 'npx prisma generate'
                            sh 'npx tsc --noEmit'
                            sh 'npm run build'
                            sh 'npm run test'
                        }
                    }
                }
            }
        }

        stage('Parallel Integration Validation') {
            parallel {
                stage('Docker Validation') {
                    steps {
                        script {
                            echo "Building Backend Docker Image: ${BACKEND_IMAGE}:${BUILD_NUMBER}..."
                            sh "docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -t ${BACKEND_IMAGE}:latest ./backend"
                            
                            echo "Building Frontend Docker Image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}..."
                            sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} -t ${FRONTEND_IMAGE}:latest ./frontend"
                        }
                    }
                }

                stage('Compose Validation') {
                    steps {
                        // Check Compose configuration validity
                        sh 'docker compose config'
                    }
                }
            }
        }

        stage('Trivy Container Scan') {
            steps {
                script {
                    echo "--- DEVSECOPS PLACEHOLDER: Trivy Image Scan ---"
                    echo "Future commands:"
                    echo "  sh 'trivy image --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${BUILD_NUMBER}'"
                    echo "  sh 'trivy image --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${BUILD_NUMBER}'"
                }
            }
        }

        stage('Docker Push') {
            steps {
                script {
                    echo "--- DOCKER REGISTRY INTEGRATION: Push Images ---"
                    // Secure login and push block (prepared for future execution, commented out by default)
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASSWORD')]) {
                        echo "Placeholder: Logging into Docker Hub..."
                        // sh "echo \$DOCKER_HUB_PASSWORD | docker login -u \$DOCKER_HUB_USER --password-stdin ${DOCKER_REGISTRY}"
                        
                        echo "Placeholder: Pushing images to registry..."
                        // sh "docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        // sh "docker push ${BACKEND_IMAGE}:latest"
                        // sh "docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        // sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Security Validation') {
            parallel {
                stage('Frontend Security Audit') {
                    steps {
                        dir('frontend') {
                            // High audit runs as non-blocking warning (stage unstable on vulnerability)
                            catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                                sh 'npm audit --audit-level=high'
                            }
                        }
                    }
                }

                stage('Backend Security Audit') {
                    steps {
                        dir('backend') {
                            catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                                sh 'npm audit --audit-level=high'
                            }
                        }
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                script {
                    echo "Archiving build deliverables..."
                    // Archive backend built scripts and frontend standalone Next assets
                    archiveArtifacts artifacts: 'backend/dist/**, frontend/.next/standalone/**', allowEmptyArchive: true
                    
                    // Archive any console log dumps generated during execution
                    archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        success {
            echo "MineCore CI Pipeline succeeded for build #${BUILD_NUMBER}."
            // Slack/Email success notification integration placeholder
        }
        failure {
            echo "MineCore CI Pipeline failed on build #${BUILD_NUMBER}. Please check console logs."
            // Slack/Email failure notification integration placeholder
        }
    }
}
