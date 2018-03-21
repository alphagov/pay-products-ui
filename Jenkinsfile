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
    stage('Test') {
      steps {
        runProductsE2E("productsui")
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
        deployEcs("products-ui", "test", null, false, false)
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
