#!/bin/bash
ENV_FILE="$WORKSPACE/pay-scripts/services/productsui.env"
if [ -f $ENV_FILE ]
then
  set -a
  source $ENV_FILE
  set +a  
fi

eval "$@"
