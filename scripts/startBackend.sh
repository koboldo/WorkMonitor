#!/bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

(cd ${SCRIPTPATH}/../code/server && node app.js)

echo
echo -------------------
echo BOT backend started!
echo -------------------
