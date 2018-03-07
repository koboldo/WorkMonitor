-- work-monitor schema
-- v1 2017-07-27
-- PRAGMA journal_mode = DELETE;
-- PRAGMA busy_timeout = 1000;

DROP TABLE IF EXISTS SETTINGS;
CREATE TABLE SETTINGS (
    PARAM_NAME VARCHAR(255),
    PARAM_VAL VARCHAR(255)
);

DROP TABLE IF EXISTS CODE_REFERENCE;
CREATE TABLE CODE_REFERENCE (
	ID INTEGER PRIMARY KEY AUTOINCREMENT,
	CODE_TABLE VARCHAR(20) NOT NULL,
	CODE VARCHAR(10) NOT NULL,
	PARAM_INTVAL INTEGER,
	PARAM_CHARVAL VARCHAR(255)
);

DROP INDEX IF EXISTS CODE_TABLE_IDX;
DROP INDEX IF EXISTS CODE_IDX;
CREATE INDEX CODE_TABLE_IDX ON CODE_REFERENCE(CODE_TABLE);
CREATE INDEX CODE_IDX ON CODE_REFERENCE(CODE_TABLE,CODE);

DROP TABLE IF EXISTS PERSON;
CREATE TABLE PERSON (
	ID INTEGER PRIMARY KEY AUTOINCREMENT,
	FIRST_NAME VARCHAR(255) NOT NULL,
	LAST_NAME VARCHAR(255) NOT NULL,
	INITIALS VARCHAR(10),
    EMAIL VARCHAR(10) UNIQUE NOT NULL,
    PASSWORD VARCHAR(100),
	PWD_TOKEN VARCHAR(100),
    IS_ACTIVE VARCHAR(1) NOT NULL,    
	OFFICE_CODE VARCHAR(10) NOT NULL,
    ROLE_CODE VARCHAR(10) NOT NULL,
    RANK_CODE VARCHAR(10) NOT NULL,
	COMPANY VARCHAR(100),
	ACCOUNT VARCHAR(100),
	PHONE VARCHAR(20),
	POSITION VARCHAR(50),
	ADDRESS_STREET VARCHAR(100),
	ADDRESS_POST VARCHAR(100),
	PROJECT_FACTOR REAL,
	IS_FROM_POOL VARCHAR(1),
	AGREEMENT_CODE VARCHAR(10),
	SALARY INT,
	SALARY_RATE INT
);

DROP TABLE IF EXISTS WORK_ORDER;
CREATE TABLE WORK_ORDER (
	ID INTEGER PRIMARY KEY AUTOINCREMENT,
	WORK_NO VARCHAR(200) NOT NULL,
	STATUS_CODE VARCHAR(10) NOT NULL,
	TYPE_CODE VARCHAR(10) NOT NULL,
	OFFICE_CODE VARCHAR(10),
    COMPLEXITY_CODE VARCHAR(10) NOT NULL,
    COMPLEXITY INTEGER,
    DESCRIPTION VARCHAR(255),
    COMMENT VARCHAR(255),
    MD_CAPEX VARCHAR(255), --MD stands for META-DATA
	-- MD_BUILDING_TYPE VARCHAR(255),
    -- MD_CONSTRUCTION_CATEGORY VARCHAR(255),
	-- ADDRESS VARCHAR(255),
	PROTOCOL_NO VARCHAR(255),
	IS_FROM_POOL VARCHAR (1) DEFAULT 'Y',
    PRICE INTEGER,
	TOTAL_PRICE INTEGER,
	CREATED INTEGER,
	LAST_MOD INTEGER,
	MODIFIED_BY INTEGER, 
	ITEM_ID INTEGER,
	VENTURE_ID INTEGER,
	FOREIGN KEY(ITEM_ID) REFERENCES RELATED_ITEM(ID),
	FOREIGN KEY(VENTURE_ID) REFERENCES PERSON(ID)
);

DROP INDEX IF EXISTS WORK_ORDER_NO_IDX;
CREATE INDEX WORK_ORDER_NO_IDX ON WORK_ORDER(WORK_NO);

DROP TABLE IF EXISTS WORK_ORDER_HIST;
CREATE TABLE WORK_ORDER_HIST (
	ID INTEGER,
	WORK_NO VARCHAR(200),
	STATUS_CODE VARCHAR(10),
	TYPE_CODE VARCHAR(10) NOT NULL,
	OFFICE_CODE VARCHAR(10),
    COMPLEXITY_CODE VARCHAR(10),
    COMPLEXITY INTEGER,
    DESCRIPTION VARCHAR(255),
    COMMENT VARCHAR(255),
    MD_CAPEX VARCHAR(255),
    PRICE INTEGER,
	PROTOCOL_NO VARCHAR(255),
	IS_FROM_POOL VARCHAR (1) DEFAULT 'Y',
	CREATED INTEGER,
	LAST_MOD INTEGER,
	HIST_CREATED INTEGER,
	MODIFIED_BY INTEGER, 	
	ITEM_ID INTEGER,
	VENTURE_ID INTEGER
);

DROP INDEX IF EXISTS WORK_ORDER_HIST_ID_IDX;
CREATE INDEX WORK_ORDER_HIST_ID_IDX ON WORK_ORDER_HIST(ID);


DROP TABLE IF EXISTS RELATED_ITEM;
CREATE TABLE RELATED_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
	ITEM_NO VARCHAR(200),
    DESCRIPTION VARCHAR(255),
	ADDRESS VARCHAR(255),
    MD_BUILDING_TYPE VARCHAR(255),
    MD_CONSTRUCTION_CATEGORY VARCHAR(255),
	CREATED INTEGER
);

DROP INDEX IF EXISTS RELATED_ITEM_ID_IDX;
CREATE INDEX RELATED_ITEM_ID_IDX ON RELATED_ITEM(ID);


DROP TABLE IF EXISTS ADDRESS;
CREATE TABLE ADDRESS (
	ID INTEGER PRIMARY KEY AUTOINCREMENT,
	CITY VARCHAR(100),
	POSTAL_CODE VARCHAR(5) NOT NULL,
	POST_OFFICE VARCHAR(100) NOT NULL,
	STREET VARCHAR(255) NOT NULL,
	STREET_NO VARCHAR(10) NOT NULL,
	APART_NO VARCHAR(10),
	COUNTRY VARCHAR(100) NOT NULL,
	WO_ID INTEGER NOT NULL,
    FOREIGN KEY(WO_ID) REFERENCES WORK_ORDER(ID)
);

DROP TABLE IF EXISTS WORK_TYPE;
CREATE TABLE WORK_TYPE (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    TYPE_CODE VARCHAR(10) NOT NULL,
    OFFICE_CODE VARCHAR(10) NOT NULL,
	DESCRIPTION VARCHAR(100) NOT NULL,
	IS_FROM_POOL VARCHAR(1) NOT NULL,
    COMPLEXITY_CODE VARCHAR(10) NOT NULL,
    COMPLEXITY INTEGER,
    PRICE INTEGER
);

DROP TABLE IF EXISTS PERSON_WO;
CREATE TABLE PERSON_WO (
	PERSON_ID INTEGER NOT NULL,
	WO_ID INTEGER NOT NULL,
	CREATED INTEGER,
	UNIQUE (PERSON_ID, WO_ID) ON CONFLICT IGNORE,
    FOREIGN KEY(PERSON_ID) REFERENCES PERSON(ID),
    FOREIGN KEY(WO_ID) REFERENCES WORK_ORDER(ID)
);

DROP INDEX IF EXISTS PERSON_WO_PID_IDX;
DROP INDEX IF EXISTS PERSON_WO_WID_IDX;
CREATE INDEX PERSON_WO_PID_IDX ON PERSON_WO(PERSON_ID);
CREATE INDEX PERSON_WO_WID_IDX ON PERSON_WO(WO_ID);

DROP TABLE IF EXISTS TIME_SHEET;
CREATE TABLE TIME_SHEET (
	PERSON_ID INTEGER NOT NULL,
	WORK_DATE INTEGER NOT NULL,
	USED_TIME INTEGER,
	-- new fields
	FROM_DATE INTEGER,
	TO_DATE INTEGER,
	BREAK NUMBER DEFAULT 900,
	IS_LEAVE VARCHAR(1) DEFAULT 'N',
	CREATED INTEGER,
	LAST_MOD INTEGER,
	CREATED_BY INTEGER, 
	MODIFIED_BY INTEGER, 
	UNIQUE (WORK_DATE, PERSON_ID) ON CONFLICT IGNORE,
	FOREIGN KEY(PERSON_ID) REFERENCES PERSON(ID)
);

DROP INDEX IF EXISTS TIME_SHEET_PID_IDX;
DROP INDEX IF EXISTS TIME_SHEET_WD_IDX;
CREATE INDEX TIME_SHEET_PID_IDX ON TIME_SHEET(PERSON_ID);
CREATE INDEX TIME_SHEET_WD_IDX ON TIME_SHEET(WORK_DATE);

DROP TABLE IF EXISTS SEQUENCER;
CREATE TABLE SEQUENCER (
    SEQ_NAME VARCHAR (10) NOT NULL,
    SEQ_VAL  INTEGER      NOT NULL,
    UNIQUE (SEQ_NAME, SEQ_VAL)
);

DROP TABLE IF EXISTS HOLIDAYS;
CREATE TABLE HOLIDAYS (
    HDATE INTEGER NOT NULL UNIQUE ON CONFLICT IGNORE,
    NAME  VARCHAR (30)
);


DROP TABLE IF EXISTS PAYROLL;
CREATE TABLE PAYROLL (
	PERSON_ID INTEGER NOT NULL,
	PERIOD_DATE INTEGER NOT NULL,
	WORK_TIME INTEGER NOT NULL,
    LEAVE_TIME INTEGER NOT NULL,
    POOL_WORK_TIME INTEGER NOT NULL,
    LEAVE_DUE INTEGER NOT NULL,
    OVER_TIME INTEGER NOT NULL,
    WORK_DUE INTEGER NOT NULL,
	OVER_DUE INTEGER NOT NULL,
	TOTAL_DUE INTEGER NOT NULL,
	IS_FROM_POOL VARCHAR(1) NOT NULL,
	RANK_CODE VARCHAR(10) NOT NULL,
	PROJECT_FACTOR REAL,
    POOL_RATE REAL,
	OVER_TIME_FACTOR REAL,
	APPROVED VARCHAR(1) NOT NULL,
	LAST_MOD INTEGER,
	MODIFIED_BY INTEGER, 
	UNIQUE (PERSON_ID, PERIOD_DATE) ,
	FOREIGN KEY(PERSON_ID) REFERENCES PERSON(ID)
);


DROP INDEX IF EXISTS PAYROLL_PID_IDX;
DROP INDEX IF EXISTS PAYROLL_PD_IDX;
CREATE INDEX PAYROLL_PID_IDX ON PAYROLL(PERSON_ID);
CREATE INDEX PAYROLL_PD_IDX ON PAYROLL(PERIOD_DATE);

PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS LOG_WO;
DROP TRIGGER IF EXISTS SET_TIMING_WORK_ORDER;
DROP TRIGGER IF EXISTS SET_TIMING_RELATED_ITEM;
DROP TRIGGER IF EXISTS SET_TIMING_PERSON_WO;
DROP TRIGGER IF EXISTS SET_TIMING_TIME_SHEET;
DROP TRIGGER IF EXISTS SET_TIMING2_TIME_SHEET;
DROP TRIGGER IF EXISTS CALC_USED_TIME_SHEET;
DROP TRIGGER IF EXISTS CALC_USED2_TIME_SHEET;
DROP TRIGGER IF EXISTS SET_TIMING_PAYROLL;

CREATE TRIGGER LOG_WO BEFORE UPDATE ON WORK_ORDER
WHEN
    OLD.STATUS_CODE <> NEW.STATUS_CODE
BEGIN
    INSERT INTO WORK_ORDER_HIST ( ID, WORK_NO, STATUS_CODE, TYPE_CODE, OFFICE_CODE, COMMENT, MD_CAPEX, PROTOCOL_NO, IS_FROM_POOL, DESCRIPTION, COMPLEXITY_CODE, COMPLEXITY, PRICE, ITEM_ID, VENTURE_ID, MODIFIED_BY, CREATED, LAST_MOD, HIST_CREATED )
    VALUES ( OLD.ID, OLD.WORK_NO, OLD.STATUS_CODE, OLD.TYPE_CODE, OLD.OFFICE_CODE, OLD.COMMENT, OLD.MD_CAPEX, OLD.PROTOCOL_NO, OLD.IS_FROM_POOL, OLD.DESCRIPTION, OLD.COMPLEXITY_CODE, OLD.COMPLEXITY, OLD.PRICE, OLD.ITEM_ID, OLD.VENTURE_ID, OLD.MODIFIED_BY, OLD.CREATED, OLD.LAST_MOD, STRFTIME('%s','NOW') );
    
    UPDATE WORK_ORDER 
    SET LAST_MOD = STRFTIME('%s','NOW')
    WHERE ID = OLD.ID;
END;

CREATE TRIGGER SET_TIMING_WORK_ORDER AFTER INSERT ON WORK_ORDER
WHEN
    NEW.CREATED IS NULL
BEGIN
    UPDATE WORK_ORDER
	SET LAST_MOD = STRFTIME('%s','NOW'), CREATED = STRFTIME('%s','NOW')
	WHERE ID = NEW.ID;
END;

CREATE TRIGGER SET_TIMING_RELATED_ITEM AFTER INSERT ON RELATED_ITEM
WHEN
	NEW.CREATED IS NULL
BEGIN
	UPDATE RELATED_ITEM
	SET CREATED = STRFTIME('%s','NOW')
	WHERE ID = NEW.ID;
END;

CREATE TRIGGER SET_TIMING_PERSON_WO AFTER INSERT ON PERSON_WO
WHEN
	NEW.CREATED IS NULL
BEGIN
	UPDATE PERSON_WO
	SET CREATED = STRFTIME('%s','NOW')
	WHERE PERSON_ID = NEW.PERSON_ID AND WO_ID = NEW.WO_ID;
END;

CREATE TRIGGER CALC_USED_TIME_SHEET AFTER INSERT ON TIME_SHEET
WHEN
	NEW.FROM_DATE IS NOT NULL AND NEW.TO_DATE IS NOT NULL AND NEW.BREAK IS NOT NULL
BEGIN
	UPDATE TIME_SHEET
	SET USED_TIME = NEW.TO_DATE - NEW.FROM_DATE - NEW.BREAK
	WHERE PERSON_ID = NEW.PERSON_ID AND WORK_DATE = NEW.WORK_DATE;
END;

CREATE TRIGGER CALC_USED2_TIME_SHEET AFTER UPDATE ON TIME_SHEET
WHEN
	COALESCE(OLD.FROM_DATE,0) <> NEW.FROM_DATE OR COALESCE(OLD.TO_DATE,0) <> NEW.TO_DATE OR OLD.BREAK <> NEW.BREAK 
BEGIN
	UPDATE TIME_SHEET
	SET USED_TIME = MAX(COALESCE(NEW.TO_DATE,OLD.TO_DATE,0) - COALESCE(NEW.FROM_DATE,OLD.FROM_DATE,0) - COALESCE(NEW.BREAK,OLD.BREAK,0),0)
	WHERE PERSON_ID = OLD.PERSON_ID AND WORK_DATE = OLD.WORK_DATE;
END;

CREATE TRIGGER SET_TIMING_TIME_SHEET AFTER INSERT ON TIME_SHEET
WHEN
	NEW.CREATED IS NULL
BEGIN
	UPDATE TIME_SHEET
	SET CREATED = STRFTIME('%s','NOW')
	WHERE PERSON_ID = NEW.PERSON_ID AND WORK_DATE = NEW.WORK_DATE;
END;

CREATE TRIGGER SET_TIMING2_TIME_SHEET AFTER UPDATE ON TIME_SHEET
WHEN
	COALESCE(OLD.FROM_DATE,0) <> NEW.FROM_DATE OR COALESCE(OLD.TO_DATE,0) <> NEW.TO_DATE OR OLD.BREAK <> NEW.BREAK 
BEGIN
	UPDATE TIME_SHEET
	SET LAST_MOD = STRFTIME('%s','NOW')
	WHERE PERSON_ID = NEW.PERSON_ID AND WORK_DATE = NEW.WORK_DATE;
END;

CREATE TRIGGER SET_TIMING_PAYROLL AFTER INSERT ON PAYROLL
BEGIN
	UPDATE PAYROLL
	SET LAST_MOD = STRFTIME('%s','NOW')
	WHERE PERSON_ID = NEW.PERSON_ID AND PERIOD_DATE = NEW.PERIOD_DATE;
END;
