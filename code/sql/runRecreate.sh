#!/bin/bash
set -x 
# SET DIR FOR IMPORT DATA
# DATA_DIR=../../data
# DB_DIR=../env_specific
DATA_DIR=/home/botconsole/data
DB_DIR=/home/botconsole/env_specific

sqlite3 -init setup_db.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init initdata.sql $DB_DIR/work-monitor.db ".exit"

#TEST DATA USED ONLY TO CHECK API WITH SOAPUI
# echo "Loading test data ..."
# sqlite3 -init testdata.sql $DB_DIR/work-monitor.db ".exit"

# REMOVE COMMENT BELOW TO IMPORT REAL DATA
sqlite3 -init beforeImport.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/WORK_TYPE_CODE_REFERENCE.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/WORK_TYPE.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/zlecajacy.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/ludzie.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/WO_WAR_LUKASZ.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/2017_RAPORT_1.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init $DATA_DIR/2017_RAPORT_2.sql $DB_DIR/work-monitor.db ".exit"
sqlite3 -init afterImport.sql $DB_DIR/work-monitor.db ".exit"