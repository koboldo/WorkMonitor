#!/bin/bash
# set -x 

DAYS=()

PERIOD_DATE_PREFIX=201801
DAYS_TO_SWITCH=31
for DAY in $(seq -f "%02g" $DAYS_TO_SWITCH); do	DAYS+=($PERIOD_DATE_PREFIX$DAY); done

# PERIOD_DATE_PREFIX=201802
# DAYS_TO_SWITCH=28
# for DAY in $(seq -f "%02g" $DAYS_TO_SWITCH); do	DAYS+=($PERIOD_DATE_PREFIX$DAY); done

# PERIOD_DATE_PREFIX=201803
# DAYS_TO_SWITCH=31
# for DAY in $(seq -f "%02g" $DAYS_TO_SWITCH); do	DAYS+=($PERIOD_DATE_PREFIX$DAY); done



for DAY in ${DAYS[@]}
do 
	date +%Y%m%d -s "$DAY"
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

./setCurrentTime.sh