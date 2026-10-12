// =============================================================================
// Declarative Jenkins pipeline — BUILD ONCE, PROMOTE THE SAME IMAGE: DEV → UAT → PROD.
// The image is tagged with the git commit SHA; each environment only changes config
// (Kustomize overlay + ConfigMap config.json), never the image contents.
//
// Jenkins setup needed (Manage Jenkins):
//   - Credentials: 'registry-creds' (username/password for the container registry),
//                  'kubeconfig-dev', 'kubeconfig-uat', 'kubeconfig-prod' (secret files)
//   - SonarQube server named 'sonarqube' (+ the SonarQube Scanner tool), webhook back to Jenkins
//   - An agent labelled 'docker' with Node 24, Docker and kubectl installed
// =============================================================================
pipeline {
  agent { label 'docker' }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 45, unit: 'MINUTES')
  }

  environment {
    REGISTRY = 'myregistry.azurecr.io'
    IMAGE    = "${REGISTRY}/adme-portal-angular"
    TAG      = "${env.GIT_COMMIT?.take(8) ?: 'local'}"
    CI       = 'true'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      // npm ci = exact versions from package-lock.json, clean install (reproducible builds).
      steps { sh 'npm ci' }
    }

    stage('Quality') {
      parallel {
        stage('Lint')   { steps { sh 'npx ng lint' } }
        stage('Format') { steps { sh 'npm run format:check' } }
        stage('Audit')  { steps { sh 'npm audit --omit=dev --audit-level=high' } }   // fail on high/critical CVEs
      }
    }

    stage('Unit tests + coverage') {
      steps { sh 'npx ng test --watch=false --coverage' }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
          archiveArtifacts allowEmptyArchive: true, artifacts: 'coverage/**'
        }
      }
    }

    stage('SonarQube') {
      steps {
        withSonarQubeEnv('sonarqube') {
          sh '''npx -y sonarqube-scanner \
                 -Dsonar.projectKey=adme-portal-angular \
                 -Dsonar.sources=src -Dsonar.exclusions=**/*.spec.ts,**/mock/** \
                 -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info'''
        }
      }
    }

    stage('Quality gate') {
      // Waits for SonarQube's webhook; fails the build if the gate (coverage, bugs, smells) fails.
      steps { timeout(time: 10, unit: 'MINUTES') { waitForQualityGate abortPipeline: true } }
    }

    stage('Docker build') {
      // The Dockerfile runs `ng build --configuration production` in its first stage.
      steps { sh 'docker build -t $IMAGE:$TAG .' }
    }

    stage('Push') {
      when { branch 'main' }
      steps {
        withCredentials([usernamePassword(credentialsId: 'registry-creds',
                                          usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          // --password-stdin: the secret never appears in the process list or logs.
          sh 'echo "$REG_PASS" | docker login $REGISTRY -u "$REG_USER" --password-stdin'
          sh 'docker push $IMAGE:$TAG'
        }
      }
    }

    stage('Deploy DEV') {
      when { branch 'main' }
      steps { deployTo('dev') }
    }

    stage('Deploy UAT') {
      when { branch 'main' }
      steps {
        input message: "Promote ${TAG} to UAT?", ok: 'Deploy'
        deployTo('uat')
      }
    }

    stage('Deploy PROD') {
      when { branch 'main' }
      steps {
        input message: "Promote ${TAG} to PRODUCTION?", ok: 'Deploy', submitter: 'release-managers'
        deployTo('prod')
      }
    }
  }

  post {
    always  { sh 'docker image rm $IMAGE:$TAG || true' }
    failure { echo 'Pipeline failed — check the stage logs above.' }
  }
}

// Same image, different overlay. Rollback: kubectl -n adme-<env> rollout undo deployment/adme-portal
def deployTo(String envName) {
  withCredentials([file(credentialsId: "kubeconfig-${envName}", variable: 'KUBECONFIG')]) {
    dir("deploy/k8s/overlays/${envName}") {
      sh "kustomize edit set image adme-portal-angular=${IMAGE}:${TAG}"
    }
    sh "kubectl apply -k deploy/k8s/overlays/${envName}"
    sh "kubectl -n adme-${envName} rollout status deployment/adme-portal --timeout=180s"
  }
}
