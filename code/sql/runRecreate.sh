#!/bin/bash
set -x 
echo "Creating db structure ..."
sqlite3 -init setup_db.sql ../env_specific/work-monitor.db ".exit"
echo "Setting initial configuration ..."
sqlite3 -init initdata.sql ../env_specific/work-monitor.db ".exit"
# echo "Loading test data ..."
# sqlite3 -init testdata.sql ../env_specific/work-monitor.db ".exit"


# sqlite3 -init beforeImport.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/WORK_TYPE_CODE_REFERENCE.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/WORK_TYPE.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/zlecajacy.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/ludzie.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/WO_WAR_LUKASZ.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/2017_RAPORT_1.sql ../env_specific/work-monitor.db ".exit"
# sqlite3 -init ../../data/2017_RAPORT_2.sql ../env_specific/work-monitor.db ".exit"
