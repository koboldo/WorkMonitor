-- work-monitor schema
-- v1 2017-07-27

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
	OFFICE_CODE VARCHAR(10) NOT NULL,
    GRADE_CODE VARCHAR(10) NOT NULL
);

DROP TABLE IF EXISTS WORK_ORDER;
CREATE TABLE WORK_ORDER (
	ID INTEGER PRIMARY KEY AUTOINCREMENT,
	WORK_NO VARCHAR(200) NOT NULL,
	STATUS_CODE VARCHAR(10) NOT NULL,
    COMPLEXITY_CODE VARCHAR(10) NOT NULL,
    COMPLEXITY INTEGER,
    DESCRIPTION VARCHAR(255),
    COMMENT VARCHAR(255),
    PRICE INTEGER,
	VERSION INTEGER,
	LAST_MOD INTEGER
);

DROP INDEX IF EXISTS WORK_ORDER_NO_IDX;
CREATE INDEX WORK_ORDER_NO_IDX ON WORK_ORDER(WORK_NO);

DROP TABLE IF EXISTS WORK_ORDER_HIST;
CREATE TABLE WORK_ORDER_HIST (
	ID INTEGER,
	WORK_NO VARCHAR(200),
	STATUS_CODE VARCHAR(10),
    COMPLEXITY_CODE VARCHAR(10),
    COMPLEXITY INTEGER,
    DESCRIPTION VARCHAR(255),
    COMMENT VARCHAR(255),
    PRICE INTEGER,
	VERSION INTEGER,
	LAST_MOD INTEGER
);

DROP INDEX IF EXISTS WORK_ORDER_HIST_ID_IDX;
CREATE INDEX WORK_ORDER_HIST_ID_IDX ON WORK_ORDER_HIST(ID);

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
    WORK_TYPE_CODE VARCHAR(10) NOT NULL,
    OFFICE_CODE VARCHAR(10) NOT NULL,
    COMPLEXITY_CODE VARCHAR(10) NOT NULL,
    COMPLEXITY INTEGER,
    PRICE INTEGER
);

DROP TABLE IF EXISTS PERSON_WO;
CREATE TABLE PERSON_WO (
	PERSON_ID INTEGER NOT NULL,
	WO_ID INTEGER NOT NULL,
    FOREIGN KEY(PERSON_ID) REFERENCES PERSON(ID),
    FOREIGN KEY(WO_ID) REFERENCES WORK_ORDER(ID)
);

DROP TABLE IF EXISTS ACCOUNT;
CREATE TABLE ACCOUNT (
	ID INTEGER PRIMARY KEY AUTOINCREMENT,
    LOGIN VARCHAR(10) NOT NULL,
    PASSWORD VARCHAR(100),
    STATUS_CODE VARCHAR(10) NOT NULL,
    IS_ACTIVE VARCHAR(1) NOT NULL,
    PERSON_ID INTEGER
);

DROP TRIGGER IF EXISTS LOG_WO;
CREATE TRIGGER LOG_WO BEFORE UPDATE ON WORK_ORDER
WHEN
    OLD.WORK_NO <> NEW.WORK_NO
    OR OLD.STATUS_CODE <> NEW.STATUS_CODE
    OR OLD.DESCRIPTION <> NEW.DESCRIPTION
    OR OLD.COMMENT <> NEW.COMMENT
    OR OLD.COMPLEXITY_CODE <> NEW.COMPLEXITY_CODE
    OR OLD.COMPLEXITY <> NEW.COMPLEXITY
    OR OLD.PRICE <> NEW.PRICE
BEGIN
    INSERT INTO WORK_ORDER_HIST ( ID, WORK_NO, STATUS_CODE, COMMENT, DESCRIPTION, COMPLEXITY_CODE, COMPLEXITY, PRICE, LAST_MOD, VERSION )
    VALUES ( OLD.ID, OLD.WORK_NO, OLD.STATUS_CODE, OLD.COMMENT, OLD.DESCRIPTION, OLD.COMPLEXITY_CODE, OLD.COMPLEXITY, OLD.PRICE, OLD.LAST_MOD, OLD.VERSION );
    
    UPDATE WORK_ORDER 
    SET LAST_MOD = STRFTIME('%s','NOW'), VERSION = (SELECT VERSION FROM WORK_ORDER WHERE ID = OLD.ID) + 1
    WHERE ID = OLD.ID;
END;

DROP TRIGGER IF EXISTS SET_VERSION_WORK_ORDER;
CREATE TRIGGER SET_VERSION_WORK_ORDER AFTER INSERT ON WORK_ORDER
BEGIN
    UPDATE WORK_ORDER SET VERSION = 1, LAST_MOD = STRFTIME('%s','NOW');
END;

