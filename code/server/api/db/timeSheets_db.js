/* jshint node: true, esversion: 6 */
'use strict';

const logErrAndCall = require('../local_util').logErrAndCall;
const dbUtil = require('./db_util');
// const logger = require('../logger').getLogger('monitor'); 
const logger = require('../logger').logger; 
const addCtx = require('../logger').addCtx;

const queries = {
	getTimesheet: 
    `SELECT PERSON_ID, ROUND(CAST(USED_TIME AS DOUBLE)/3600.0,2) AS USED_TIME, BREAK/60 AS BREAK, TRAINING/60 AS TRAINING, IS_LEAVE, DATETIME(FROM_DATE,"unixepoch","localtime") AS FROM_DATE, DATETIME(TO_DATE,"unixepoch","localtime") AS TO_DATE, (PC.FIRST_NAME || " " || PC.LAST_NAME) AS CREATED_BY, (PM.FIRST_NAME || " " || PM.LAST_NAME) AS MODIFIED_BY 
    FROM TIME_SHEET TS LEFT JOIN PERSON PC ON TS.CREATED_BY = PC.ID LEFT JOIN PERSON PM ON TS.MODIFIED_BY = PM.ID WHERE %(personId)s AND %(workDate)s`,
    getTimesheets: 
    `WITH MYL(N) AS (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9)),
    MY_FROM_DATE(T) AS (VALUES (%(workDateAfter)s)),
    MY_TO_DATE(T) AS (VALUES (%(workDateBefore)s))    
    SELECT P.ID AS PERSON_ID, FD.T+86400*(M3.N*100+M2.N*10+M1.N) AS SWD , COALESCE(DATETIME(TS.FROM_DATE,"unixepoch","localtime"), DATETIME(FD.T + 86400 * (M3.N * 100 + M2.N * 10 + M1.N),"unixepoch")) FROM_DATE, COALESCE(DATETIME(TS.TO_DATE,"unixepoch","localtime"), DATETIME(FD.T + 86400 * (M3.N * 100 + M2.N * 10 + M1.N),"unixepoch")) TO_DATE, COALESCE(ROUND(CAST(TS.USED_TIME AS DOUBLE)/3600.0,2),0) AS USED_TIME, COALESCE(TS.BREAK/60,0) AS BREAK, COALESCE(TRAINING/60,0) AS TRAINING, COALESCE(TS.IS_LEAVE,'N') AS IS_LEAVE, (PC.FIRST_NAME || " " || PC.LAST_NAME) AS CREATED_BY, (PM.FIRST_NAME || " " || PM.LAST_NAME) AS MODIFIED_BY, TS.FROM_IP, TS.FROM_IS_MOBILE, G_FROM.ISP AS FROM_ISP, G_FROM.ORG AS FROM_ORG, G_FROM.CITY AS FROM_CITY, G_FROM.REGION AS FROM_REGION, TS.TO_IP, TS.TO_IS_MOBILE, G_TO.ISP AS TO_ISP, G_TO.ORG AS TO_ORG, G_TO.CITY AS TO_CITY, G_TO.REGION AS TO_REGION
    FROM MYL M1, MYL M2, MYL M3, MY_FROM_DATE FD, MY_TO_DATE TD, PERSON P 
        LEFT JOIN TIME_SHEET TS ON P.ID = TS.PERSON_ID AND SWD = TS.WORK_DATE LEFT JOIN PERSON PC ON TS.CREATED_BY = PC.ID LEFT JOIN PERSON PM ON TS.MODIFIED_BY = PM.ID
        LEFT JOIN IP_GEO G_TO   ON G_TO.IP = TS.TO_IP
        LEFT JOIN IP_GEO G_FROM ON G_FROM.IP = TS.FROM_IP
    WHERE SWD <= (TD.T)*1 %(personId)s
    ORDER BY 1,3`,    
    insertLeave:
    `WITH MYL(N) AS (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9))
    , MY_FROM_DATE(T) AS (VALUES (%(FROM_DATE)s))
    , MY_TO_DATE(T) AS (VALUES (%(TO_DATE)s))
    REPLACE INTO TIME_SHEET(
        PERSON_ID, WORK_DATE, USED_TIME, FROM_DATE, TO_DATE, IS_LEAVE, CREATED_BY, BREAK )
    SELECT
        %(PERSON_ID)s, FD.T+86400*(M3.N*100+M2.N*10+M1.N), 8*60*60, FD.T+86400*(M3.N*100+M2.N*10+M1.N), FD.T+86400*(M3.N*100+M2.N*10+M1.N)+8*60*60, "Y", %(CREATED_BY)s, 0
    FROM
        MYL M1, MYL M2,MYL M3, MY_FROM_DATE FD, MY_TO_DATE TD 
    WHERE 
        M3.N*100+M2.N*10+M1.N <= (TD.T-FD.T)/86400 AND (FD.T + 86400*(M3.N*100+M2.N*10+M1.N)) NOT IN (SELECT H.HDATE FROM HOLIDAYS H)`,
    getMonthTimestats:
    `WITH RECURSIVE
    QUERY_PARAMS AS (
        SELECT "%(periodDate)s" PERIOD_DATE, "%(personId)s" PERSON_ID_LIST
    )
    , TIME_PARAMS AS (
        SELECT TL.TIME_AFTER,
               TL.TIME_BEFORE,
               ( ( (TL.TIME_BEFORE - TL.TIME_AFTER + 1) / 86400) - COUNT(1) ) * 8 PERIOD_LENGTH
          FROM HOLIDAYS,
               (
        SELECT 
                 CAST(STRFTIME('%%s', PERIOD_DATE, 'start of month') AS INTEGER) TIME_AFTER,
                 CAST(STRFTIME('%%s', PERIOD_DATE, 'start of month', '+1 month', '-1 second') AS INTEGER) TIME_BEFORE
                   FROM QUERY_PARAMS
               ) TL
          WHERE HDATE BETWEEN TL.TIME_AFTER AND TL.TIME_BEFORE
    )
    , SPLIT_PERSON_IDS (ID, REST) AS (
        SELECT '' ID, PERSON_ID_LIST || ',' REST
        FROM QUERY_PARAMS
        UNION ALL
        SELECT SUBSTR(REST, 0 , INSTR(REST, ',')),
        SUBSTR(REST, INSTR(REST, ',') + 1)
        FROM SPLIT_PERSON_IDS
        WHERE REST <> ''
    )
    , PERSON_IDS (ID) AS (
        SELECT ID FROM SPLIT_PERSON_IDS WHERE ID <> ''
    )
    , PERIOD_WO AS (
        SELECT Q.ID, Q.WORK_NO, Q.PRICE, Q.COMPLEXITY, Q.IS_FROM_POOL
        FROM WORK_ORDER Q JOIN (
            SELECT ID, MIN(LAST_MOD) MIN_LAST_MOD
            FROM (
                SELECT WO.ID, WO.LAST_MOD
                FROM WORK_ORDER WO
                WHERE STATUS_CODE = 'CO'
                UNION ALL
                SELECT WOH.ID, WOH.LAST_MOD
                FROM WORK_ORDER_HIST WOH
                WHERE STATUS_CODE = 'CO'
            ) JOIN TIME_PARAMS TP
            GROUP BY ID
            HAVING MIN(LAST_MOD) BETWEEN TP.TIME_AFTER AND TP.TIME_BEFORE
        ) F ON Q.ID = F.ID    
    )
    , PERIOD_STATS AS (
       SELECT CAST(COALESCE(
            (SELECT SUM(PRICE)
            FROM PERIOD_WO
            WHERE IS_FROM_POOL = "Y")
            ,0) * 415 AS DOUBLE) / 1000.0 BUDGET
    )
    , PERSON_TIME AS (
        SELECT 
            PERSON_ID
            , ROUND(CAST (SUM(CASE WHEN IS_LEAVE = "N" THEN USED_TIME - TRAINING ELSE 0 END) AS DOUBLE) / 3600.0, 2) WORK_TIME
            , ROUND(CAST (SUM(CASE WHEN IS_LEAVE = "Y" THEN USED_TIME ELSE 0 END) AS DOUBLE) / 3600.0, 2) LEAVE_TIME
            , ROUND(CAST (SUM(CASE WHEN IS_LEAVE = "N" THEN TRAINING ELSE 0 END) AS DOUBLE) / 3600.0, 2) TRAINING_TIME        
        FROM TIME_SHEET, TIME_PARAMS TP
        WHERE WORK_DATE BETWEEN TP.TIME_AFTER AND TP.TIME_BEFORE
        GROUP BY PERSON_ID
    )
    , PERSON_NONPOOL_WO_TIME AS (
        SELECT PW.PERSON_ID, ROUND(SUM(PRWO.COMPLEXITY),2) NONPOOL_TIME
        FROM PERIOD_WO PRWO JOIN PERSON_WO PW ON PRWO.ID = PW.WO_ID
        WHERE PRWO.IS_FROM_POOL = "N"
        GROUP BY PW.PERSON_ID
    )
    , PERSON_INIT AS (
      SELECT ID, ROWID, IS_FROM_POOL, IS_EMPLOYED, RANK_CODE, ROLE_CODE, PROJECT_FACTOR, SALARY, SALARY_RATE, LEAVE_RATE, LAST_MOD
      FROM (
      SELECT ID
            , (ROWID + 1000000) AS ROWID
            , IS_FROM_POOL
            , IS_EMPLOYED
            , RANK_CODE
            , ROLE_CODE
            , PROJECT_FACTOR
            , COALESCE(SALARY,0) SALARY
            , COALESCE(SALARY_RATE,0) SALARY_RATE
            , COALESCE(LEAVE_RATE,0) LEAVE_RATE
            , CASE 
                WHEN LAST_MOD IS NOT NULL THEN LAST_MOD
                WHEN CREATED IS NOT NULL THEN CREATED
                ELSE CAST(STRFTIME('%%s','2000-01-01') AS INTEGER)
              END LAST_MOD
        FROM PERSON
        UNION ALL     
        SELECT ID
            , ROWID
            , IS_FROM_POOL
            , IS_EMPLOYED
            , RANK_CODE
            , ROLE_CODE
            , PROJECT_FACTOR
            , COALESCE(SALARY,0) SALARY
            , COALESCE(SALARY_RATE,0) SALARY_RATE
            , COALESCE(LEAVE_RATE,0) LEAVE_RATE
            , CASE 
                WHEN LAST_MOD IS NOT NULL THEN LAST_MOD
                WHEN CREATED IS NOT NULL THEN CREATED
                ELSE CAST(STRFTIME('%%s','2000-01-01') AS INTEGER)
              END LAST_MOD
        FROM PERSON_HIST
        WHERE IS_DELETED = 'N'
        ) WHERE ROLE_CODE LIKE '%%EN%%' OR ROLE_CODE LIKE '%%MG%%' OR ROLE_CODE LIKE '%%OP%%'
    )
    , PERIOD_PERSON AS (
        SELECT PI.* FROM PERSON_INIT PI
        JOIN (
            SELECT ID, MAX(ROWID) MAX_ROWID
            FROM PERSON_INIT, TIME_PARAMS TP
            WHERE LAST_MOD < TP.TIME_BEFORE
            GROUP BY ID
        ) FL ON PI.ID = FL.ID AND PI.ROWID = FL.MAX_ROWID
    )    
    , PERSON_STATS AS (
        SELECT
            Q.ID PERSON_ID
            , Q.PERIOD_BEGINNING 
            , Q.PERIOD_END
            , Q.WORK_TIME
            , Q.LEAVE_TIME
            , Q.NONPOOL_WORK_TIME
            , CASE WHEN Q.POOL_WORK_TIME > 0 THEN Q.POOL_WORK_TIME ELSE 0 END POOL_WORK_TIME
            , CASE WHEN Q.OVER_TIME > 0 THEN Q.OVER_TIME ELSE 0 END OVER_TIME      
            , Q.TRAINING_TIME          
            , Q.IS_FROM_POOL
        FROM (
            SELECT
                P.ID
                -- HERE DATE IS WITHOUT "localtime" BECAUSE DIFF IN TIMEZONES CHANGES DAY NUMBER
                , DATE(TP.TIME_AFTER,"unixepoch") PERIOD_BEGINNING
                , DATE(TP.TIME_BEFORE,"unixepoch") PERIOD_END
                , COALESCE(PT.WORK_TIME,0) WORK_TIME
                , COALESCE(PT.LEAVE_TIME,0) LEAVE_TIME
                , COALESCE(PT.TRAINING_TIME,0) TRAINING_TIME
                , CASE WHEN P.IS_FROM_POOL = "Y" THEN ROUND(PT.WORK_TIME - COALESCE(PNPT.NONPOOL_TIME,0),2) ELSE 0 END POOL_WORK_TIME
                , CASE WHEN P.IS_FROM_POOL = "Y" THEN COALESCE(PNPT.NONPOOL_TIME,0) ELSE COALESCE(PT.WORK_TIME,0) END NONPOOL_WORK_TIME
                , ROUND(PT.WORK_TIME + PT.LEAVE_TIME + PT.TRAINING_TIME - TP.PERIOD_LENGTH,2) OVER_TIME
                , P.IS_FROM_POOL
            FROM PERIOD_PERSON P 
                LEFT JOIN PERSON_TIME PT ON P.ID = PT.PERSON_ID 
                LEFT JOIN PERSON_NONPOOL_WO_TIME PNPT ON P.ID = PNPT.PERSON_ID
                JOIN TIME_PARAMS TP JOIN QUERY_PARAMS QP
            WHERE P.RANK_CODE IS NOT NULL
                AND CASE WHEN QP.PERSON_ID_LIST = '0' THEN 1
                WHEN P.ID IN (SELECT ID FROM PERSON_IDS) THEN 1
                ELSE 0 END
        ) Q
    )
    
    SELECT PERSON_ID, PERIOD_BEGINNING, PERIOD_END, WORK_TIME, LEAVE_TIME, NONPOOL_WORK_TIME, POOL_WORK_TIME, OVER_TIME, TRAINING_TIME, IS_FROM_POOL 
    FROM PERSON_STATS`,
    getWeekTimestats:
    `WITH RECURSIVE
         QUERY_PARAMS AS (
             SELECT "%(periodDate)s" PERIOD_DATE, "%(personId)s" PERSON_ID_LIST
         )
         , MONTH_PARAMS AS (
             SELECT
                 DATE(PERIOD_DATE, 'start of month')                           AS MONTH_START,
                 DATE(PERIOD_DATE, 'start of month', '+1 month', '-1 day')     AS MONTH_END,
                 DATE(PERIOD_DATE, 'start of month', '-5 days')                AS MIN_RANGE, -- search for weeks on previous month if any workday belongs
                 DATE(PERIOD_DATE, 'start of month', '+1 month', '-1 day', '+2 days')  AS MAX_RANGE -- ignore weekends even if they overlap to next month we may want to include such week
             FROM QUERY_PARAMS
         )

         , VALID_WEEKS AS (
                 -- generate all Mondays that could be relevant (start from the Monday on/before month_start,
                 -- stepping by 7 days). Each row represents a Monday->Sunday week.
                 WITH RECURSIVE monday(m) AS (
                     SELECT DATE((SELECT MONTH_START FROM MONTH_PARAMS), 'weekday 1', '-7 days')
                     UNION ALL
                     SELECT DATE(m, '+7 days') FROM monday
                     WHERE m <= (SELECT MAX_RANGE FROM MONTH_PARAMS)
                 )
                 SELECT
                     m AS WEEK_START,
                     DATE(m, '+6 days') AS WEEK_END
                 FROM monday
                 WHERE WEEK_END <= (SELECT MAX_RANGE FROM MONTH_PARAMS)
                 AND m > (SELECT MIN_RANGE FROM MONTH_PARAMS)
             )

         , TIME_PARAMS AS (
             -- one row per valid week: epoch bounds and PERIOD_LENGTH (work days * 8 minus holidays)
             SELECT
                 CAST(STRFTIME('%%s', WEEK_START) AS INTEGER)                             AS TIME_AFTER,
                 (CAST(STRFTIME('%%s', WEEK_END) AS INTEGER) + 86399)                     AS TIME_BEFORE, -- include full Sunday
                 (
                   (
                     ( (CAST(STRFTIME('%%s', WEEK_END) AS INTEGER) + 86399)
                       - CAST(STRFTIME('%%s', WEEK_START) AS INTEGER)
                       + 1
                     ) / 86400
                   )
                   -
                   (
                     -- count holidays that fall anywhere inside the week (compare as epoch ints)
                     SELECT COUNT(1)
                     FROM HOLIDAYS H
                     WHERE H.HDATE BETWEEN CAST(STRFTIME('%%s', WEEK_START) AS INTEGER)
                                      AND (CAST(STRFTIME('%%s', WEEK_END) AS INTEGER) + 86399)
                   )
                 ) * 8                                                                 AS PERIOD_LENGTH
             FROM VALID_WEEKS
         )

         , SPLIT_PERSON_IDS (ID, REST) AS (
             SELECT '' ID, PERSON_ID_LIST || ',' REST
             FROM QUERY_PARAMS
             UNION ALL
             SELECT SUBSTR(REST, 0 , INSTR(REST, ',')),
             SUBSTR(REST, INSTR(REST, ',') + 1)
             FROM SPLIT_PERSON_IDS
             WHERE REST <> ''
         )
         , PERSON_IDS (ID) AS (
             SELECT ID FROM SPLIT_PERSON_IDS WHERE ID <> ''
         )
         -- include TP.TIME_AFTER so each WO belongs to a specific week
         , PERIOD_WO AS (
             SELECT Q.ID, Q.WORK_NO, Q.PRICE, Q.COMPLEXITY, Q.IS_FROM_POOL, TP.TIME_AFTER AS PERIOD_START
             FROM TIME_PARAMS TP
             JOIN (
                 SELECT
                     ID,
                     MIN(LAST_MOD) AS MIN_LAST_MOD
                 FROM (
                     SELECT ID, LAST_MOD FROM WORK_ORDER     WHERE STATUS_CODE = 'CO'
                     UNION ALL
                     SELECT ID, LAST_MOD FROM WORK_ORDER_HIST WHERE STATUS_CODE = 'CO'
                 )
                 GROUP BY ID
             ) X ON X.MIN_LAST_MOD BETWEEN TP.TIME_AFTER AND TP.TIME_BEFORE
             JOIN WORK_ORDER Q ON Q.ID = X.ID
         )
         , PERIOD_STATS AS (
            SELECT CAST(COALESCE(
                 (SELECT SUM(PRICE)
                 FROM PERIOD_WO
                 WHERE IS_FROM_POOL = "Y")
                 ,0) * 415 AS DOUBLE) / 1000.0 BUDGET
         )
         -- aggregate timesheets per person *per week*
         , PERSON_TIME AS (
             SELECT
                 TP.TIME_AFTER AS PERIOD_START,
                 TS.PERSON_ID,
                 ROUND(SUM(CASE WHEN TS.IS_LEAVE = 'N' THEN TS.USED_TIME - TS.TRAINING ELSE 0 END) / 3600.0, 2) AS WORK_TIME,
                 ROUND(SUM(CASE WHEN TS.IS_LEAVE = 'Y' THEN TS.USED_TIME ELSE 0 END) / 3600.0, 2) AS LEAVE_TIME,
                 ROUND(SUM(CASE WHEN TS.IS_LEAVE = 'N' THEN TS.TRAINING ELSE 0 END) / 3600.0, 2) AS TRAINING_TIME
             FROM TIME_SHEET TS
             JOIN TIME_PARAMS TP
               ON TS.WORK_DATE BETWEEN TP.TIME_AFTER AND TP.TIME_BEFORE
             GROUP BY TP.TIME_AFTER, TS.PERSON_ID
         )
         -- non-pool workload per person per week
         , PERSON_NONPOOL_WO_TIME AS (
             SELECT PRWO.PERIOD_START, PW.PERSON_ID, ROUND(SUM(PRWO.COMPLEXITY), 2) AS NONPOOL_TIME
             FROM PERIOD_WO PRWO
             JOIN PERSON_WO PW ON PW.WO_ID = PRWO.ID
             WHERE PRWO.IS_FROM_POOL = 'N'
             GROUP BY PRWO.PERIOD_START, PW.PERSON_ID
         )
         , PERSON_INIT AS (
           SELECT ID, ROWID, IS_FROM_POOL, IS_EMPLOYED, RANK_CODE, ROLE_CODE, PROJECT_FACTOR, SALARY, SALARY_RATE, LEAVE_RATE, LAST_MOD
           FROM (
           SELECT ID
                 , (ROWID + 1000000) AS ROWID
                 , IS_FROM_POOL
                 , IS_EMPLOYED
                 , RANK_CODE
                 , ROLE_CODE
                 , PROJECT_FACTOR
                 , COALESCE(SALARY,0) SALARY
                 , COALESCE(SALARY_RATE,0) SALARY_RATE
                 , COALESCE(LEAVE_RATE,0) LEAVE_RATE
                 , CASE
                     WHEN LAST_MOD IS NOT NULL THEN LAST_MOD
                     WHEN CREATED IS NOT NULL THEN CREATED
                     ELSE CAST(STRFTIME('%%s','2000-01-01') AS INTEGER)
                   END LAST_MOD
             FROM PERSON
             UNION ALL
             SELECT ID
                 , ROWID
                 , IS_FROM_POOL
                 , IS_EMPLOYED
                 , RANK_CODE
                 , ROLE_CODE
                 , PROJECT_FACTOR
                 , COALESCE(SALARY,0) SALARY
                 , COALESCE(SALARY_RATE,0) SALARY_RATE
                 , COALESCE(LEAVE_RATE,0) LEAVE_RATE
                 , CASE
                     WHEN LAST_MOD IS NOT NULL THEN LAST_MOD
                     WHEN CREATED IS NOT NULL THEN CREATED
                     ELSE CAST(STRFTIME('%%s','2000-01-01') AS INTEGER)
                   END LAST_MOD
             FROM PERSON_HIST
             WHERE IS_DELETED = 'N'
             ) WHERE ROLE_CODE LIKE '%%EN%%' OR ROLE_CODE LIKE '%%MG%%' OR ROLE_CODE LIKE '%%OP%%'
         )
         -- choose the correct person snapshot for each week (per TP)
         , PERIOD_PERSON AS (
             WITH SNAP AS (
                 SELECT PI.*, TP.TIME_AFTER AS PERIOD_START
                 FROM PERSON_INIT PI
                 JOIN TIME_PARAMS TP
                  ON PI.LAST_MOD < TP.TIME_BEFORE
             ),
             MAXROW AS (
                 SELECT ID, PERIOD_START, MAX(ROWID) AS MAX_ROWID
                 FROM SNAP
                 GROUP BY ID, PERIOD_START
             )
             SELECT S.*
             FROM SNAP S
             JOIN MAXROW M
               ON S.ID = M.ID
              AND S.PERIOD_START = M.PERIOD_START
              AND S.ROWID = M.MAX_ROWID
         )
         , PERSON_STATS AS (
             SELECT
                 P.ID AS PERSON_ID,
                 DATE(TP.TIME_AFTER, 'unixepoch') AS PERIOD_BEGINNING,
                 DATE(TP.TIME_BEFORE, 'unixepoch') AS PERIOD_END,
                 COALESCE(PT.WORK_TIME, 0) AS WORK_TIME,
                 COALESCE(PT.LEAVE_TIME, 0) AS LEAVE_TIME,
                 COALESCE(PNPT.NONPOOL_TIME, 0) AS NONPOOL_WORK_TIME,
                 CASE WHEN P.IS_FROM_POOL = "Y" THEN ROUND( COALESCE(PT.WORK_TIME,0) - COALESCE(PNPT.NONPOOL_TIME,0), 2) ELSE 0 END AS POOL_WORK_TIME,
                 CASE WHEN (ROUND(COALESCE(PT.WORK_TIME,0) + COALESCE(PT.LEAVE_TIME,0) + COALESCE(PT.TRAINING_TIME,0) - TP.PERIOD_LENGTH,2)) > 0
                      THEN ROUND(COALESCE(PT.WORK_TIME,0) + COALESCE(PT.LEAVE_TIME,0) + COALESCE(PT.TRAINING_TIME,0) - TP.PERIOD_LENGTH,2)
                      ELSE 0 END AS OVER_TIME,
                 COALESCE(PT.TRAINING_TIME,0) AS TRAINING_TIME,
                 P.IS_FROM_POOL
             FROM TIME_PARAMS TP
             JOIN PERIOD_PERSON P ON P.PERIOD_START = TP.TIME_AFTER
             LEFT JOIN PERSON_TIME PT ON PT.PERIOD_START = TP.TIME_AFTER AND PT.PERSON_ID = P.ID
             LEFT JOIN PERSON_NONPOOL_WO_TIME PNPT ON PNPT.PERIOD_START = TP.TIME_AFTER AND PNPT.PERSON_ID = P.ID
             JOIN QUERY_PARAMS QP
                 WHERE P.RANK_CODE IS NOT NULL
                     AND CASE WHEN QP.PERSON_ID_LIST = '0' THEN 1
                     WHEN P.ID IN (SELECT ID FROM PERSON_IDS) THEN 1
                     ELSE 0 END
             )

         SELECT PERSON_ID, PERIOD_BEGINNING, PERIOD_END, WORK_TIME, LEAVE_TIME, NONPOOL_WORK_TIME, POOL_WORK_TIME, OVER_TIME, TRAINING_TIME, IS_FROM_POOL
         FROM PERSON_STATS`
};

const filters = {
    getTimesheet: {
        personId: 'TS.PERSON_ID = %(personId)s',
        workDate: 'TS.WORK_DATE = CAST(STRFTIME("%%s","%(workDate)s","start of day") AS INTEGER)',
    },    
    getTimesheets: {
        workDateBefore: 'CAST(STRFTIME("%%s","%(workDateBefore)s","start of day") AS INTEGER)',
        workDateAfter: 'CAST(STRFTIME("%%s","%(workDateAfter)s","start of day") AS INTEGER)',
        personId: 'AND P.ID = %(personId)s'
    },
    insertLeave:{
        FROM_DATE: 'CAST(STRFTIME("%%s","%(FROM_DATE)s","start of day") AS INTEGER)',
        TO_DATE: 'CAST(STRFTIME("%%s","%(TO_DATE)s","start of day") AS INTEGER)',
        PERSON_ID: '%(PERSON_ID)s',
        CREATED_BY: '%(CREATED_BY)s'
    },
    getTimestats: {
        periodDate: '%(periodDate)s',
        personId: '%(personId)s'
    }
};

const timeSheets_db = {
        
	readAll: function(params, cb, db) {
        // const db = dbUtil.getDatabase();
        const myDB = (db == null) ? dbUtil.getDatabase() : db;
        const query = dbUtil.prepareFiltersByInsertion(queries.getTimesheets,params,filters.getTimesheets);
        const getTimesheetsStat = myDB.prepare(query);
		getTimesheetsStat.all(addCtx(function(err, rows) {
            getTimesheetsStat.finalize();
            // db.close();
            if(db == null) myDB.close();
			if(err) return logErrAndCall(err,cb);
			
			if(rows == null) {
				cb(null,null);
				return;
            }
            cb(null,rows);
		}));        
    },

    read: function(params, cb, db) {
        // const db = dbUtil.getDatabase();
        const myDB = (db == null) ? dbUtil.getDatabase() : db;
        const query = dbUtil.prepareFiltersByInsertion(queries.getTimesheet,params,filters.getTimesheet);
        const getTimesheetStat = myDB.prepare(query);
        getTimesheetStat.get(addCtx((err,row)=>{
            getTimesheetStat.finalize();
            // db.close();
            if(db == null) myDB.close();

            if(err) return logErrAndCall(err,cb);
            cb(null, row);
        }));
    },

    create: function(timeSheet, cb) {
        let workDateCopy = timeSheet.WORK_DATE;
        timeSheet.WORK_DATE = `STRFTIME('%s','${timeSheet.WORK_DATE}','start of day')`;

        if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = `STRFTIME('%s','${timeSheet.FROM_DATE}','utc')`; 
        if(timeSheet.TO_DATE)   timeSheet.TO_DATE = `STRFTIME('%s','${timeSheet.TO_DATE}','utc')`;       
        if(timeSheet.BREAK)     timeSheet.BREAK = `${timeSheet.BREAK}*60`;
        if(timeSheet.TRAINING)  timeSheet.TRAINING = `${timeSheet.TRAINING}*60`;
        
        logger().debug(`creating timesheet ${JSON.stringify(timeSheet)}`);  
        
        const mydb = dbUtil.getDatabase();

        //results denotes if update was successful - if not insert is needed
        const idObj = {};
        idObj.PERSON_ID = timeSheet.PERSON_ID;
        idObj.WORK_DATE = `(SELECT ${timeSheet.WORK_DATE})`;

        let timeSheetCopy = { ...timeSheet }
        delete timeSheetCopy.CREATED_BY;

        dbUtil.performUpdate(idObj, timeSheetCopy, 'TIME_SHEET', addCtx((err,result) => {
            if(err) {
                mydb.close();
                logErrAndCall(err,cb);
            }   
            else if(result) { 
                this.read(
                    {
                        personId: timeSheetCopy.PERSON_ID, 
                        workDate: workDateCopy
                    },
                    (err,row)=>{
                        mydb.close();
                        if(err) logErrAndCall(err,cb);
                        cb(null, 1, row);
                    },
                    mydb
                );
            } else {
                dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, addCtx((err, newId) => {
                    if(err) {  
                        mydb.close();
                        logErrAndCall(err,cb);  
                    } else if(newId) {
                        this.read(
                            { 
                                personId: timeSheet.PERSON_ID, 
                                workDate: workDateCopy  
                            },
                            addCtx((err,row)=>{
                                        mydb.close();
                                        if(err) logErrAndCall(err,cb); 
                                        else cb(null, 0, row);
                                    }), 
                            mydb
                        ); 
                    } else {
                        mydb.close();
                    }
                }, mydb));
            }
        }), mydb);
    },

    create2: function(timeSheet, cb) {
        
        let workDateCopy = timeSheet.WORK_DATE;
        timeSheet.WORK_DATE = `STRFTIME('%s','${timeSheet.WORK_DATE}','start of day')`;

        if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = `STRFTIME('%s','${timeSheet.FROM_DATE}','utc')`; 
        if(timeSheet.TO_DATE)   timeSheet.TO_DATE = `STRFTIME('%s','${timeSheet.TO_DATE}','utc')`;       
        if(timeSheet.BREAK)     timeSheet.BREAK = `${timeSheet.BREAK}*60`;
        if(timeSheet.TRAINING)  timeSheet.TRAINING = `${timeSheet.TRAINING}*60`;
        
        logger().debug(`creating timesheet ${JSON.stringify(timeSheet)}`);
        
        const mydb = dbUtil.getDatabase();

        //newId denotes if insert was successful - if not update is needed (there already was such record)
        dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, addCtx((err, newId) => {
            let updating = false;
            if(err) {  
                mydb.close();
                logErrAndCall(err,cb);  
            } else if(newId) {
                this.read(
                    { 
                        personId: timeSheet.PERSON_ID, 
                        workDate: workDateCopy  
                    },
                    addCtx((err,row)=>{
                                mydb.close();
                                if(err) logErrAndCall(err,cb); 
                                else cb(null, 0, row);
                            }), 
                    mydb
                ); 
            } else {
                updating = true;
                const idObj = {};
                idObj.PERSON_ID = timeSheet.PERSON_ID;
                idObj.WORK_DATE = `(SELECT ${timeSheet.WORK_DATE})`;
                delete timeSheet.CREATED_BY;

                dbUtil.performUpdate(idObj, timeSheet, 'TIME_SHEET', addCtx((err,result) => {
                    if(err) {
                        mydb.close();
                        logErrAndCall(err,cb);
                    }   
                    else if(result) { 
                        this.read(
                            {
                                personId: timeSheet.PERSON_ID, 
                                workDate: workDateCopy
                            },
                            (err,row)=>{
                                mydb.close();
                                if(err) logErrAndCall(err,cb);
                                cb(null, 1, row);
                            },
                            mydb
                        );
                    } else {
                        mydb.close();
                    }
                }, mydb));    
            }
            // if(!updating) mydb.close();
        }), mydb);
    },

    createLeave: function(leaveSheet, cb) {

        const db = dbUtil.getDatabase();
        const query = dbUtil.prepareFiltersByInsertion(queries.insertLeave,leaveSheet,filters.insertLeave);
        if(logger().isDebugEnabled()) logger().debug('query for insert leave: ' + query);
        const leaveSheetStat = db.prepare(query);
        leaveSheetStat.run(addCtx((err,result)=>{
            leaveSheetStat.finalize();
            if(err)  {
                logErrAndCall(err,cb);  
                db.close();
            } else {
                this.readAll(
                    {
                        workDateAfter: leaveSheet.FROM_DATE,
                        workDateBefore: leaveSheet.TO_DATE,
                        personId: leaveSheet.PERSON_ID
                    },
                    (err,rows)=>{
                        if(err)  logErrAndCall(err,cb);  
                        else cb(null,rows);
                        db.close();
                    },
                    db
                );
            }
        }));
    },

    readMonthStats: function(params, cb) {
        const db = dbUtil.getDatabase();
        logger().debug('params ' + JSON.stringify(params));
        
        const query = dbUtil.prepareFiltersByInsertion(queries.getMonthTimestats,params,filters.getTimestats);
        // logger().debug('query is : ' + query);
        const getTimestatsStat = db.prepare(query);
		getTimestatsStat.all(addCtx(function(err, rows) {
            getTimestatsStat.finalize();
            db.close();
			if(err) return logErrAndCall(err,cb);
			
			if(rows == null) {
				cb(null,null);
				return;
            }
            cb(null,rows);
		}));  
    },

    readWeekStats: function(params, cb) {
            const db = dbUtil.getDatabase();
            logger().debug('params ' + JSON.stringify(params));

            const query = dbUtil.prepareFiltersByInsertion(queries.getWeekTimestats,params,filters.getTimestats);
            // logger().debug('query is : ' + query);
            const getTimestatsStat = db.prepare(query);
    		getTimestatsStat.all(addCtx(function(err, rows) {
                getTimestatsStat.finalize();
                db.close();
    			if(err) return logErrAndCall(err,cb);

    			if(rows == null) {
    				cb(null,null);
    				return;
                }
                cb(null,rows);
    		}));
        }
/**
    bulkCreate: function(timeSheets, cb) {

        if(logger.isDebugEnabled()) logger.debug('bulk insert for timeSheet list of length: ' + timeSheets.length);

        const mydb = dbUtil.getDatabase();

        const calls = [];
        calls.push(function(_cb) {
            dbUtil.startTx(mydb,function(err, result){
                if(err) _cb(err);
                else _cb(null,result);
            });
        });
        
        timeSheets.forEach((timeSheet) => {
            if(timeSheet.WORK_DATE) timeSheet.WORK_DATE = '(STRFTIME("%s","' + timeSheet.WORK_DATE + '")/86400)*86400';
            if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = timeSheet.FROM_DATE/1000; 
            if(timeSheet.TO_DATE)   timeSheet.TO_DATE = timeSheet.TO_DATE/1000;
            //if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = 'STRFTIME("%s","' + timeSheet.FROM_DATE + '")'; 
            //if(timeSheet.TO_DATE)   timeSheet.TO_DATE = 'STRFTIME("%s","' + timeSheet.TO_DATE + '")';
            calls.push(
                function(_cb) {
                    dbUtil.performInsert(timeSheet,'TIME_SHEET',null,function(err,singleResult){
                        if(err) _cb(err);
                        else _cb(null,singleResult);
                    }, mydb);	
                });
            calls.push(
                function(_cb) {
                    const idObj = {};
                    idObj.PERSON_ID = timeSheet.PERSON_ID;
                    idObj.WORK_DATE = timeSheet.WORK_DATE;
                    dbUtil.performUpdate(idObj, timeSheet, 'TIME_SHEET', function(err,singleResult){
                        if(err) _cb(err);
                        else _cb(null,singleResult);
                    }, mydb);
                }
            );
        });

        async.series(
            calls,
            function(err, results) {
				if(err) {
					dbUtil.rollbackTx(mydb);
					return local_util.logErrAndCall(err,cb);
				} else {
					dbUtil.commitTx(mydb);
					cb(null,1);
				}
		});
    }
*/
};

module.exports = timeSheets_db;
