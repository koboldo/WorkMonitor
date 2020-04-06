#!/bin/bash

TS=`date "+%Y%m%dT%H%M%S"`
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

cd ../code/frontend/
echo
echo ==================
echo "Working in $PWD"...
echo ==================
echo

npm run-script build &&
tar zcvf /tmp/testbotdist_${TS?}.tar.gz bot &&
scp /tmp/testbotdist_${TS?}.tar.gz testbot@jdmiddleware.pl:WorkMonitorFrontend/ &&

echo ==================
echo Working at testbot@jdmiddleware.pl...
echo ==================

ssh testbot@jdmiddleware.pl << EOF
  cd WorkMonitorFrontend
  tar zcvf "testbotdist_backup.tar.gz" bot
  rm -rf bot 
  tar zxvf "testbotdist_${TS?}.tar.gz"
  ./restart_nginx.sh
EOF


cd -

