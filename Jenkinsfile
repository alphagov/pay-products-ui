#!/usr/bin/env groovy

pipeline {
  agent any

  parameters {
    booleanParam(defaultValue: false, description: '', name: 'runEndToEndTestsOnPR')
    string(name: 'CYPRESS_VERSION', defaultValue: '9.5.0', description: 'Cypress version number')
  }

  options {
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@master")
  }

  environment {
    RUN_END_TO_END_ON_PR = "${params.runEndToEndTestsOnPR}"
    JAVA_HOME="/usr/lib/jvm/java-1.11.0-openjdk-amd64"
    CYPRESS_VERSION = "${params.CYPRESS_VERSION}"
  }

  stages {
    stage('Docker Build') {
      steps {
        script {
          buildMultistageAppWithMetrics {
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
    stage('Browser Tests') {
      steps {
        cypress('products-ui')
      }
      post { 
        always { 
          script {
            cypress.cleanUp()
          }
        }
      }
    }
    stage('Contract Tests') {
      steps {
        script {
          env.PACT_TAG = gitBranchName()
        }
        ws('contract-tests-wp') {
          runPactProviderTests("pay-products", "${env.PACT_TAG}", "products-ui")
          runPactProviderTests("pay-adminusers", "${env.PACT_TAG}")
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
