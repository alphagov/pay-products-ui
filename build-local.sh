#!/bin/bash

set -e

cd "$(dirname "$0")"

npm install
npm run compile
docker build -t govukpay/products-ui:local .
