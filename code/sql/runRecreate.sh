#!/bin/bash
# set -x 
# SET DIR FOR IMPORT DATA
DATA_DIR=../../data

echo "Creating db structure ..."
sqlite3 -init setup_db.sql ../env_specific/work-monitor.db ".exit"
echo "Setting initial configuration ..."
sqlite3 -init initdata.sql ../env_specific/work-monitor.db ".exit"

#TEST DATA USED ONLY TO CHECK API WITH SOAPUI
# echo "Loading test data ..."
# sqlite3 -init testdata.sql ../env_specific/work-monitor.db ".exit"

# REMOVE COMMENT BELOW TO IMPORT REAL DATA
# sqlite3 -init beforeImport.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/WORK_TYPE_CODE_REFERENCE.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/WORK_TYPE.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/zlecajacy.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/ludzie.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/WO_WAR_LUKASZ.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/2017_RAPORT_1.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init $DATA_DIR/2017_RAPORT_2.sql ../env_specific/work-monitor.db ".exit"
