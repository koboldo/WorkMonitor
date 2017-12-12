#!/bin/bash

RESULT_FILE=import.sql
DATA_DIR=../../data

rm $RESULT_FILE
cat setup_db.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat initdata.sql > $RESULT_FILE
echo "" >> $RESULT_FILE
cat setup_db.sql > $RESULT_FILE

echo "" >> $RESULT_FILE
cat beforeImport.sql >> $RESULT_FILE

echo "" >> $RESULT_FILE
cat $DATA_DIR/WORK_TYPE_CODE_REFERENCE.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat $DATA_DIR/WORK_TYPE.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat $DATA_DIR/zlecajacy.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat $DATA_DIR/ludzie.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat $DATA_DIR/WO_WAR_LUKASZ.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat $DATA_DIR/2017_RAPORT_1.sql >> $RESULT_FILE
echo "" >> $RESULT_FILE
cat $DATA_DIR/2017_RAPORT_2.sql >> $RESULT_FILE

