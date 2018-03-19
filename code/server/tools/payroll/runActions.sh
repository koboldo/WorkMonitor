#!/bin/bash
# set -x 

PERIOD_DATE_PREFIX=201801
DAYS_TO_SWITCH=31

CURRENT_DATE=$(date +%Y%m%d)
CURRENT_TIME=$(date +%T)

for DAY in $(seq -f "%02g" $DAYS_TO_SWITCH)
do 
	# echo $PERIOD_DATE_PREFIX$DAY
	date +%Y%m%d -s "$PERIOD_DATE_PREFIX$DAY"
	date +%T -s "08:00:00"

	(cd ../..; nohup ./runapp.bat &)
	
	sleep 5
	
	node actionPerformer.js
	STATUS=$?
	
	../../killapp.bat
	
	
	(( STATUS > 0 )) && {
		echo "There was an error !!!"
		break
	}
done

date +%Y%m%d -s "$CURRENT_DATE"
date +%T -s "$CURRENT_TIME"