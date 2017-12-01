#!/bin/bash

export WM_CONF_DIR=/home/botconsole/env_specific
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

(cd ${SCRIPTPATH}/../code/server && node app.js)

echo
echo -------------------
echo BOT backend started!
echo -------------------
