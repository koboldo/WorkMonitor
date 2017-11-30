#!/bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

nginx -c ${SCRIPTPATH}/../code/frontend/nginx.conf



