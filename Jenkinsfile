#!/usr/bin/env groovy

pipeline {
  agent any

  parameters {
    booleanParam(defaultValue: false, description: '', name: 'runEndToEndTestsOnPR')
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
    stage('Test') {
      when {
        anyOf {
          branch 'master'
          environment name: 'RUN_END_TO_END_ON_PR', value: 'true'
        }
      }
      steps {
        runAppE2E("products-ui", "products")
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
