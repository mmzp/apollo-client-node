pipeline {
  agent any
  stages {
    stage('build') {
      steps {
        sh 'echo "build"'
        sleep 1
      }
    }
    stage('unit_test') {
      steps {
        sh 'echo "npm run test"'
      }
    }
    stage('deploy') {
      steps {
        sh 'echo "publish"'
        sh 'echo "npm start"'
        echo 'deploy success'
      }
    }
  }
}