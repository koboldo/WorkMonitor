#!/bin/bash
wget -t5 -O time.txt time-a-g.nist.gov:13

# DAY=$(cut -c7-14 time.txt)
# HOUR=$(cut -c16-17 time.txt)
# MINUTES=$(cut -c18-23 time.txt)

# (( HOUR++ ))

# echo "20$DAY $HOUR$MINUTES"
# echo 20$DAY