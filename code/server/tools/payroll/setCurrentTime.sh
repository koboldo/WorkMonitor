#!/bin/bash

$(curl -ks -o time.json https://www.worldtimeserver.com/handlers/GetData.ashx?action=GCTData&_=1522064312713)
echo "Setting time"
DATE_TIME=$(cut -d'"' -f50 time.json)

YEAR=$( echo $DATE_TIME | cut -c1-4 )
MONTH=$( echo $DATE_TIME | cut -c6-7 )
DAY=$( echo $DATE_TIME | cut -c9-10 )
TIME=$( echo $DATE_TIME | cut -c12-19 )
HOUR=$( echo $DATE_TIME | cut -c12-13 )
MINUTES=$( echo $DATE_TIME | cut -c15-16 )
SECONDS=$( echo $DATE_TIME | cut -c18-19 )

date +%Y%m%d -s "$YEAR$MONTH$DAY"
date +%T -s "$TIME"