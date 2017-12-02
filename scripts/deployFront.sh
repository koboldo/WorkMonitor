#!/bin/bash

TS=`date "+%Y%m%dT%H%M%S"`
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

cd ../code/frontend/
echo
echo ==================
echo "Working in $PWD"...
echo ==================
echo

ng build --base-href . -prod &&
tar zcvf /tmp/botdist_${TS?}.tar.gz bot &&
scp /tmp/botdist_${TS?}.tar.gz botconsole@bot:/tmp &&

echo ==================
echo Working at botconsole@jdmiddleware.pl...
echo ==================

ssh botconsole@jdmiddleware.pl << EOF
  cd /var/www/html/jdmiddleware.pl
  tar zxvf "/tmp/botdist_${TS?}.tar.gz"
EOF

ssh root@jdmiddleware.pl << EOF
  echo ==================
  echo service nginx restart
  echo ==================
  
  sudo service nginx restart
EOF

cd -
