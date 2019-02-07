/* jshint node: true, esversion: 6 */
'use strict';

const dbUtil = require('./db_util');
const async = require('async');
const logErrAndCall = require('../local_util').logErrAndCall;
// const logger = require('../logger').logger; 
const addCtx = require('../logger').addCtx;

const queries = {
    calculatePayroll: 
    `WITH RECURSIVE
    QUERY_PARAMS AS (
        SELECT %(overTimeFactor)s OVER_TIME_FACTOR, '%(periodDate)s' PERIOD_DATE, '%(personId)s' PERSON_ID_LIST, '%(approved)s' APPROVED, %(modifierId)s MODIFIER_ID
    )
    , TIME_PARAMS AS (
        SELECT TL.TIME_AFTER,
               TL.TIME_BEFORE,
               ( ( (TL.TIME_BEFORE - TL.TIME_AFTER + 1) / 86400) - COUNT(1) ) * 86400 PERIOD_LENGTH
          FROM HOLIDAYS,
               (
                SELECT 
                    CAST(STRFTIME('%%s', PERIOD_DATE, 'start of month') AS INTEGER) TIME_AFTER,
                    CAST(STRFTIME('%%s', PERIOD_DATE, 'start of month', '+1 month', '-1 day', '+86399 second') AS INTEGER) TIME_BEFORE
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
            WHERE IS_FROM_POOL = 'Y')
            ,0) * 415 AS DOUBLE) / 1000.0 BUDGET
    )
    , PERSON_TIME AS (
        SELECT 
            PERSON_ID
            , ROUND(CAST (SUM(CASE WHEN IS_LEAVE = 'N' THEN USED_TIME - TRAINING ELSE 0 END) AS DOUBLE) / 3600.0, 2) WORK_TIME
            , ROUND(CAST (SUM(CASE WHEN IS_LEAVE = 'Y' THEN USED_TIME ELSE 0 END) AS DOUBLE) / 3600.0, 2) LEAVE_TIME
            , ROUND(CAST (SUM(CASE WHEN IS_LEAVE = 'N' THEN TRAINING ELSE 0 END) AS DOUBLE) / 3600.0, 2) TRAINING_TIME
        FROM TIME_SHEET, TIME_PARAMS TP
        WHERE WORK_DATE BETWEEN TP.TIME_AFTER AND TP.TIME_BEFORE
        GROUP BY PERSON_ID
    )
    , PERSON_NONPOOL_WO_TIME AS (
        SELECT PW.PERSON_ID, ROUND(SUM(PRWO.COMPLEXITY),2) NONPOOL_TIME
        FROM PERIOD_WO PRWO JOIN PERSON_WO PW ON PRWO.ID = PW.WO_ID
        WHERE PRWO.IS_FROM_POOL = 'N'
        GROUP BY PW.PERSON_ID
    )
    , PERSON_INIT AS (
      SELECT ID, IS_FROM_POOL, IS_EMPLOYED, RANK_CODE, ROLE_CODE, PROJECT_FACTOR, SALARY, SALARY_RATE, LEAVE_RATE, LAST_MOD
      FROM (
      SELECT ID,
          IS_FROM_POOL
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
                ELSE STRFTIME('%%s','2000-01-01')
              END LAST_MOD
        FROM PERSON
    UNION ALL     
        SELECT ID,
          IS_FROM_POOL
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
                ELSE HIST_CREATED
              END LAST_MOD
        FROM PERSON_HIST
        ) WHERE ROLE_CODE LIKE '%%EN%%' OR ROLE_CODE LIKE '%%MG%%' OR ROLE_CODE LIKE '%%OP%%'
    )
    , PERIOD_PERSON AS (
        SELECT PI.* FROM PERSON_INIT PI
        JOIN (
            SELECT ID, MAX(LAST_MOD) MAX_LAST_MOD
            FROM PERSON_INIT, TIME_PARAMS TP
            WHERE LAST_MOD < TP.TIME_BEFORE
            GROUP BY ID
        ) FL ON PI.ID = FL.ID AND PI.LAST_MOD = FL.MAX_LAST_MOD
    )
    , PERSON_STATS_INIT AS (
        SELECT
            Q.ID PERSON_ID
            , Q.TIME_AFTER PERIOD_DATE
            , Q.WORK_TIME
            , Q.TRAINING_TIME
            , Q.LEAVE_TIME
            , Q.NONPOOL_WORK_TIME
            , CASE WHEN Q.POOL_WORK_TIME > 0 THEN Q.POOL_WORK_TIME ELSE 0 END POOL_WORK_TIME
            , CASE WHEN Q.POOL_RATE_COMPONENT > 0 THEN Q.POOL_RATE_COMPONENT ELSE 0 END POOL_RATE_COMPONENT
            , CASE WHEN Q.OVER_TIME > 0 THEN Q.OVER_TIME ELSE 0 END OVER_TIME                
            , Q.IS_FROM_POOL
            , Q.RANK_CODE
            , Q.PROJECT_FACTOR
            , Q.SALARY
            , Q.SALARY_RATE
            , Q.LEAVE_RATE
            , Q.COMPLETED_WO
        FROM (
            SELECT
                P.ID
                , TP.TIME_AFTER
                , COALESCE(PT.WORK_TIME,0) WORK_TIME
                , COALESCE(PT.LEAVE_TIME,0) LEAVE_TIME
                , COALESCE(PT.TRAINING_TIME,0) TRAINING_TIME
                , CASE WHEN P.IS_FROM_POOL = 'Y' THEN ROUND(PT.WORK_TIME - COALESCE(PNPT.NONPOOL_TIME,0),2) ELSE 0 END POOL_WORK_TIME
                , CASE WHEN P.IS_FROM_POOL = 'Y' THEN COALESCE(PNPT.NONPOOL_TIME,0) ELSE COALESCE(PT.WORK_TIME,0) END NONPOOL_WORK_TIME
                , CASE WHEN P.IS_FROM_POOL = 'Y' THEN (PT.WORK_TIME - COALESCE(PNPT.NONPOOL_TIME,0))*P.PROJECT_FACTOR ELSE 0 END POOL_RATE_COMPONENT
                , (PT.WORK_TIME + PT.LEAVE_TIME + PT.TRAINING_TIME - TP.PERIOD_LENGTH) OVER_TIME
                , P.IS_FROM_POOL
                , P.RANK_CODE
                , P.PROJECT_FACTOR
                , COALESCE(P.SALARY,0) SALARY
                , COALESCE(P.SALARY_RATE,0) SALARY_RATE
                , COALESCE(P.LEAVE_RATE,0) LEAVE_RATE
                , (SELECT GROUP_CONCAT(PWO.ID,'|') FROM PERIOD_WO PWO JOIN PERSON_WO PW ON PWO.ID = PW.WO_ID WHERE PW.PERSON_ID = P.ID) COMPLETED_WO 
            FROM PERIOD_PERSON P 
                LEFT JOIN PERSON_TIME PT ON P.ID = PT.PERSON_ID 
                LEFT JOIN PERSON_NONPOOL_WO_TIME PNPT ON P.ID = PNPT.PERSON_ID
                JOIN TIME_PARAMS TP
                JOIN QUERY_PARAMS QP
            WHERE P.RANK_CODE IN ('DZI','REG','SEN','YOU')
            AND CASE WHEN P.IS_FROM_POOL == 'Y' 
                THEN P.IS_EMPLOYED == 'Y' OR (SELECT COUNT(1) FROM PERIOD_WO PWO JOIN PERSON_WO PW ON PWO.ID = PW.WO_ID WHERE PW.PERSON_ID = P.ID) 
                ELSE P.IS_EMPLOYED == 'Y' END
        ) Q
    )
    , PERIOD_POOL_RATE AS (
        SELECT PS.BUDGET, ROUND(PS.BUDGET*1.0 / CASE WHEN Q.POOL_RATE_COMPONENT_SUM > 0 THEN Q.POOL_RATE_COMPONENT_SUM ELSE -1111111 END,4)  POOL_RATE
        FROM
        (
            SELECT SUM(PSI.POOL_RATE_COMPONENT) POOL_RATE_COMPONENT_SUM
            FROM PERSON_STATS_INIT PSI
            WHERE IS_FROM_POOL = 'Y'
        ) Q, PERIOD_STATS PS
    )
    , PERSON_STATS AS (
        SELECT 
            Q.PERSON_ID
            , Q.PERIOD_DATE
            , Q.LEAVE_TIME        
            , Q.WORK_TIME
            , Q.TRAINING_TIME
            , Q.NONPOOL_WORK_TIME
            , Q.POOL_WORK_TIME
            , Q.OVER_TIME
            , Q.LEAVE_DUE
            , Q.TRAINING_DUE
            , Q.WORK_DUE
            , Q.OVER_DUE
            , Q.WORK_DUE + Q.LEAVE_DUE + Q.TRAINING_DUE + Q.OVER_DUE TOTAL_DUE
            , Q.IS_FROM_POOL
            , Q.RANK_CODE
            , Q.PROJECT_FACTOR
            , Q.BUDGET
            , Q.POOL_RATE
            , Q.OVER_TIME_FACTOR
            , Q.APPROVED
            , Q.COMPLETED_WO
            , Q.MODIFIER_ID
        FROM (
            SELECT PSI.PERSON_ID
                , PSI.PERIOD_DATE
                , PSI.WORK_TIME
                , PSI.LEAVE_TIME
                , PSI.TRAINING_TIME
                , PSI.POOL_WORK_TIME
                , PSI.NONPOOL_WORK_TIME
                , PSI.OVER_TIME
                , ROUND(PSI.LEAVE_TIME * PSI.LEAVE_RATE, 2) LEAVE_DUE
                , ROUND(PSI.TRAINING_TIME * PSI.LEAVE_RATE, 2) TRAINING_DUE
                , ROUND(CASE 
                    WHEN PSI.RANK_CODE = 'YOU' OR PSI.RANK_CODE = 'DZI' THEN PSI.WORK_TIME * PSI.SALARY_RATE
                    WHEN PSI.RANK_CODE = 'REG' AND PSI.IS_FROM_POOL = 'N' THEN PSI.WORK_TIME * PSI.SALARY_RATE
                    WHEN PSI.RANK_CODE = 'REG' AND PSI.IS_FROM_POOL = 'Y' AND (PPR.POOL_RATE * PSI.PROJECT_FACTOR) > PSI.SALARY_RATE THEN PSI.WORK_TIME * PPR.POOL_RATE * PSI.PROJECT_FACTOR
                    WHEN PSI.RANK_CODE = 'REG' AND PSI.IS_FROM_POOL = 'Y' AND (PPR.POOL_RATE * PSI.PROJECT_FACTOR) <= PSI.SALARY_RATE THEN PSI.WORK_TIME * PSI.SALARY_RATE
                    WHEN PSI.RANK_CODE = 'SEN' THEN PSI.SALARY
                    ELSE 0
                    END, 2) WORK_DUE
                , ROUND(CASE 
                    WHEN PSI.RANK_CODE = 'YOU'  OR PSI.RANK_CODE = 'DZI' THEN PSI.OVER_TIME * PSI.SALARY_RATE * QP.OVER_TIME_FACTOR
                    WHEN PSI.RANK_CODE = 'REG' AND PSI.IS_FROM_POOL = 'N' THEN PSI.OVER_TIME * PSI.SALARY_RATE * QP.OVER_TIME_FACTOR
                    WHEN PSI.RANK_CODE = 'REG' AND PSI.IS_FROM_POOL = 'Y' AND (PPR.POOL_RATE * PSI.PROJECT_FACTOR) > PSI.SALARY_RATE THEN PSI.OVER_TIME * PPR.POOL_RATE * PSI.PROJECT_FACTOR * QP.OVER_TIME_FACTOR
                    WHEN PSI.RANK_CODE = 'REG' AND PSI.IS_FROM_POOL = 'Y' AND (PPR.POOL_RATE * PSI.PROJECT_FACTOR) <= PSI.SALARY_RATE THEN PSI.OVER_TIME * PSI.SALARY_RATE * QP.OVER_TIME_FACTOR
                    WHEN PSI.RANK_CODE = 'SEN' THEN 0
                    ELSE 0
                    END, 2) OVER_DUE
                , PSI.IS_FROM_POOL
                , PSI.RANK_CODE
                , PSI.PROJECT_FACTOR 
                , PSI.COMPLETED_WO
                , PPR.BUDGET
                , PPR.POOL_RATE
                , QP.OVER_TIME_FACTOR
                , QP.APPROVED
                , QP.MODIFIER_ID
        FROM PERSON_STATS_INIT PSI JOIN PERIOD_POOL_RATE PPR JOIN QUERY_PARAMS QP
        WHERE CASE WHEN QP.PERSON_ID_LIST = '0' THEN 1
                     WHEN PSI.PERSON_ID IN (SELECT ID FROM PERSON_IDS) THEN 1
                     ELSE 0 END
        ) Q
    )
    
    REPLACE INTO PAYROLL (
                    PERSON_ID,
                    PERIOD_DATE,
                    LEAVE_TIME,
                    WORK_TIME,
                    TRAINING_TIME,
                    POOL_WORK_TIME,
                    NONPOOL_WORK_TIME,
                    OVER_TIME,
                    LEAVE_DUE,
                    WORK_DUE,
                    TRAINING_DUE,
                    OVER_DUE,
                    TOTAL_DUE,
                    IS_FROM_POOL,
                    RANK_CODE,
                    PROJECT_FACTOR,
                    BUDGET,
                    POOL_RATE,
                    OVER_TIME_FACTOR,
                    APPROVED,
                    COMPLETED_WO,
                    MODIFIED_BY)
                
    SELECT  PS.PERSON_ID
           , PS.PERIOD_DATE
           , PS.LEAVE_TIME        
           , PS.WORK_TIME
           , PS.TRAINING_TIME
           , PS.POOL_WORK_TIME
           , PS.NONPOOL_WORK_TIME
           , PS.OVER_TIME
           , PS.LEAVE_DUE
           , PS.WORK_DUE
           , PS.TRAINING_DUE
           , PS.OVER_DUE
           , PS.TOTAL_DUE
           , PS.IS_FROM_POOL
           , PS.RANK_CODE
           , PS.PROJECT_FACTOR
           , PS.BUDGET
           , PS.POOL_RATE
           , PS.OVER_TIME_FACTOR
           , PS.APPROVED
           , PS.COMPLETED_WO
           , PS.MODIFIER_ID
    FROM PERSON_STATS PS LEFT JOIN PAYROLL PY ON PS.PERSON_ID = PY.PERSON_ID AND PS.PERIOD_DATE = PY.PERIOD_DATE
    WHERE PY.PERIOD_DATE IS NULL OR PS.APPROVED = 'Y' OR (PS.APPROVED = 'N' AND PY.APPROVED = 'N')`,
    
    getPayroll: `SELECT PERSON_ID, DATE( PERIOD_DATE ,"unixepoch" ) PERIOD_DATE, LEAVE_TIME, WORK_TIME, TRAINING_TIME, POOL_WORK_TIME, NONPOOL_WORK_TIME, OVER_TIME, LEAVE_DUE, WORK_DUE, TRAINING_DUE, OVER_DUE, TOTAL_DUE, IS_FROM_POOL, RANK_CODE, PROJECT_FACTOR, COMPLETED_WO, BUDGET, POOL_RATE, OVER_TIME_FACTOR, APPROVED, MODIFIED_BY, DATETIME( LAST_MOD ,"unixepoch", "localtime" ) LAST_MOD
                    FROM PAYROLL WHERE 1=1 %(personId)s %(periodDate)s %(history)s ORDER BY PERSON_ID, PERIOD_DATE DESC`
};

const filters = {
    calculatePayroll: {
        overTimeFactor: '%(overTimeFactor)s',
        periodDate: '%(periodDate)s',
        modifierId: '%(modifierId)s',
        personId: '%(personId)s',
        approved: '%(approved)s'
    },
    getPayroll: {
        personId: 'AND CASE %(personId)s WHEN 0 THEN 1 ELSE PERSON_ID = %(personId)s END',
        periodDate: 'AND PERIOD_DATE = STRFTIME("%%s", "%(periodDate)s", "start of month")',
        history: 'AND PERIOD_DATE <= CAST(STRFTIME("%%s", "now", "start of month","-1 month") AS INTEGER)'
    }
};

const payroll_db = {
    read: function(params,cb){
        
        const db = dbUtil.getDatabase();
        
        const calls = [];

        calls.push(
            function(_cb){
                const query = dbUtil.prepareFiltersByInsertion(queries.calculatePayroll,params,filters.calculatePayroll);
                // if(logger().isDebugEnabled()) logger().debug('query for payroll: ' + query);
                const calculatePayrollStat = db.prepare(query);
                calculatePayrollStat.get(addCtx(function(err, result){
                    calculatePayrollStat.finalize();

                    
                    if(err) _cb(err);
                    else _cb(null,result);
                }));
            });

        calls.push(
            function(_cb) {    
                const getParams = {};
                getParams.personId = params.personId;
                if(params.history == 'N') getParams.periodDate = params.periodDate;
                else getParams.history = 'Y';
    
                const query = dbUtil.prepareFiltersByInsertion(queries.getPayroll,getParams,filters.getPayroll);
                const getPayrollStat = db.prepare(query);
                getPayrollStat.all(addCtx(function(err,rows){
                    getPayrollStat.finalize();
    
                    if(err) _cb(err);
                    else _cb(null,rows);
                }));
            });

        async.series(calls,addCtx(function(err, result){
            db.close();

            if(err) logErrAndCall(err,cb);
            else {
                cb(null,result[result.length-1]);
            }
        }));
    }
};

module.exports = payroll_db;