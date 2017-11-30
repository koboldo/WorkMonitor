#!/bin/bash

TS=`date "+%Y%m%dT%H%M%S"`
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

cd ../code/frontend/
echo
echo ==================
echo "Working in $PWD"...
echo ==================
echo

ng build -prod &&
tar zcvf /tmp/botdist_${TS?}.tar.gz dist &&
scp /tmp/botdist_${TS?}.tar.gz botconsole@bot:/tmp &&

echo ==================
echo Working at botconsole@jdmiddleware.pl...
echo ==================

ssh botconsole@jdmiddleware.pl << EOF
  cd /var/www/html/botconsole
  tar zxvf "/tmp/botdist_${TS?}.tar.gz"
  
  echo ==================
  echo service botfrontend restart
  echo ==================
  
  sudo service botfrontend restart
  
EOF

cd -
