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
          postMetric("products-ui.docker-build.failure", 1, "new")
        }
      }
    }
    stage('Test') {
      steps {
        runParameterisedEndToEnd("productsui", null, "end2end-tagged", false, false, "uk.gov.pay.endtoend.categories.End2EndProducts")
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
          postMetric("products-ui.docker-tag.failure", 1, "new")
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        deploy("products-ui", "test", null, false, false, "uk.gov.pay.endtoend.categories.SmokeProducts", true)
        deployEcs("products-ui", "test", null, true, true, "uk.gov.pay.endtoend.categories.SmokeProducts", true)
      }
    }
  }
  post {
    failure {
      postMetric("products-ui.failure", 1, "new")
    }
    success {
      postSuccessfulMetrics("products-ui")
    }
  }
}
