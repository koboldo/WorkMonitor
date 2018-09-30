DROP INDEX IF EXISTS PAYROLL_PID_IDX;
DROP INDEX IF EXISTS PAYROLL_PD_IDX;

ALTER TABLE PAYROLL RENAME TO PAYROLL_OLD;
CREATE TABLE PAYROLL (
    PERSON_ID         INTEGER      NOT NULL,
    PERIOD_DATE       INTEGER      NOT NULL,
    LEAVE_TIME        INTEGER      NOT NULL,
    WORK_TIME         INTEGER      NOT NULL,
    TRAINING_TIME     INTEGER      NOT NULL,
    POOL_WORK_TIME    INTEGER      NOT NULL,
    NONPOOL_WORK_TIME INTEGER      NOT NULL,
    OVER_TIME         INTEGER      NOT NULL,
    LEAVE_DUE         INTEGER      NOT NULL,
    WORK_DUE          INTEGER      NOT NULL,
    TRAINING_DUE      INTEGER      NOT NULL,
    OVER_DUE          INTEGER      NOT NULL,
    TOTAL_DUE         INTEGER      NOT NULL,
    COMPLETED_WO      VARCHAR(255),
    IS_FROM_POOL      VARCHAR (1)  NOT NULL,
    RANK_CODE         VARCHAR (10) NOT NULL,
    PROJECT_FACTOR    REAL,
    BUDGET            REAL,
    POOL_RATE         REAL,
    OVER_TIME_FACTOR  REAL,
    APPROVED          VARCHAR (1)  NOT NULL,
    LAST_MOD          INTEGER,
    MODIFIED_BY       INTEGER,
    UNIQUE (
        PERSON_ID,
        PERIOD_DATE
    ),
    FOREIGN KEY (
        PERSON_ID
    )
    REFERENCES PERSON (ID) 
);

INSERT INTO PAYROLL( PERSON_ID, PERIOD_DATE, LEAVE_TIME, WORK_TIME, TRAINING_TIME, POOL_WORK_TIME, NONPOOL_WORK_TIME, OVER_TIME, LEAVE_DUE, WORK_DUE, TRAINING_DUE, OVER_DUE, TOTAL_DUE, IS_FROM_POOL, RANK_CODE, PROJECT_FACTOR, BUDGET, POOL_RATE, OVER_TIME_FACTOR, APPROVED, LAST_MOD, MODIFIED_BY )
SELECT PERSON_ID, PERIOD_DATE, LEAVE_TIME, WORK_TIME, 0, POOL_WORK_TIME, NONPOOL_WORK_TIME, OVER_TIME, LEAVE_DUE, WORK_DUE, 0, OVER_DUE, TOTAL_DUE, IS_FROM_POOL, RANK_CODE, PROJECT_FACTOR, BUDGET, POOL_RATE, OVER_TIME_FACTOR, APPROVED, LAST_MOD, MODIFIED_BY
FROM PAYROLL_OLD;

DROP TABLE PAYROLL_OLD;

CREATE INDEX PAYROLL_PID_IDX ON PAYROLL(PERSON_ID);
CREATE INDEX PAYROLL_PD_IDX ON PAYROLL(PERIOD_DATE);