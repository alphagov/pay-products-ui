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
          buildApp{
            app = "products-ui"
          }
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
          dockerTag {
            app = "products-ui"
          }
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        deploy("products-ui", "test", null, true, true, "uk.gov.pay.endtoend.categories.SmokeProducts", true)
      }
    }
  }
}
