#!/usr/bin/env groovy

pipeline {
  agent any

  options {
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@master")
  }

  stages {
    stage('Docker Build') {
      steps {
        script {
          buildAppWithMetrics {
            app = "products-ui"
          }
        }
      }
      post {
        failure {
          postMetric("products-ui.docker-build.failure", 1)
        }
      }
    }
    stage('Contract Tests') {
      steps {
        script {
          env.PACT_TAG = gitBranchName()
        }
        ws('contract-tests-wp') {
          runPactProviderTests("pay-products", "${env.PACT_TAG}")
        }
      }
      post {
        always {
          ws('contract-tests-wp') {
            deleteDir()
          }
        }
      }
    }
    stage('Test') {
      steps {
        runProductsE2E("products-ui")
      }
    }
    stage('Docker Tag') {
      steps {
        script {
          dockerTagWithMetrics {
            app = "products-ui"
          }
        }
      }
      post {
        failure {
          postMetric("products-ui.docker-tag.failure", 1)
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        checkPactCompatibility("products-ui", gitCommit(), "test")
        deployEcs("products-ui")
      }
    }
    stage('Smoke Tests') {
      when {
        branch 'master'
      }
      steps {
        runProductsSmokeTest()
      }
    }
    stage('Pact Tag') {
      when {
        branch 'master'
      }
      steps {
        echo 'Tagging consumer pact with "test"'
        tagPact("products-ui", gitCommit(), "test")
      }
    }
    stage('Complete') {
      failFast true
      parallel {
        stage('Tag Build') {
          when {
            branch 'master'
          }
          steps {
            tagDeployment("products-ui")
          }
        }
        stage('Trigger Deploy Notification') {
          when {
            branch 'master'
          }
          steps {
            triggerGraphiteDeployEvent("products-ui")
          }
        }
      }
    }
  }
  post {
    failure {
      postMetric(appendBranchSuffix("products-ui") + ".failure", 1)
    }
    success {
      postSuccessfulMetrics(appendBranchSuffix("products-ui"))
    }
  }
}
