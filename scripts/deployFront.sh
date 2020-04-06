#!/bin/bash

TS=`date "+%Y%m%dT%H%M%S"`
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

cd ../code/frontend/
echo
echo ==================
echo "Working in $PWD"...
echo ==================
echo

#angular 4 ng build --base-href . -prod &&
ng build --base-href . --prod --configuration=production &&
tar zcvf /tmp/botdist_${TS?}.tar.gz bot &&
scp /tmp/botdist_${TS?}.tar.gz botconsole@jdmiddleware.pl:/tmp &&

echo ==================
echo Working at botconsole@jdmiddleware.pl...
echo ==================

ssh botconsole@jdmiddleware.pl << EOF
  cd /var/www/html/jdmiddleware.pl
  tar zcvf "/home/botconsole/front_backup/botdist_${TS?}.tar.gz" bot
  tar zxvf "/tmp/botdist_${TS?}.tar.gz"
EOF

ssh root@jdmiddleware.pl << EOF
  service nginx restart
EOF

cd -

