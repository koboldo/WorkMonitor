ALTER TABLE PERSON ADD COLUMN EXCEL_ID INTEGER;
ALTER TABLE PERSON ADD COLUMN IS_EMPLOYED VARCHAR(1);
-- AUDIT
ALTER TABLE PERSON ADD COLUMN CREATED INTEGER;
ALTER TABLE PERSON ADD COLUMN LAST_MOD INTEGER;
ALTER TABLE PERSON ADD COLUMN MODIFIED_BY INTEGER;


CREATE TABLE PERSON_HIST (
    ID INTEGER,
    EXCEL_ID INTEGER,
	FIRST_NAME VARCHAR(255),
	LAST_NAME VARCHAR(255),
	INITIALS VARCHAR(10),
    EMAIL VARCHAR(10),
    IS_ACTIVE VARCHAR(1),    
    IS_EMPLOYED VARCHAR(1),
	OFFICE_CODE VARCHAR(10),
    ROLE_CODE VARCHAR(10),
	COMPANY VARCHAR(100),
	ACCOUNT VARCHAR(100),
	PHONE VARCHAR(20),
	POSITION VARCHAR(50),
	ADDRESS_STREET VARCHAR(100),
	ADDRESS_POST VARCHAR(100),
	PROJECT_FACTOR REAL, 
	RANK_CODE VARCHAR (10), 
	AGREEMENT_CODE VARCHAR (10), 
	IS_FROM_POOL VARCHAR (1), 
	SALARY INT, 
	SALARY_RATE INT, 
	LEAVE_RATE INT,
	CREATED INTEGER,
	LAST_MOD INTEGER,
	MODIFIED_BY INTEGER,
	HIST_CREATED INTEGER
);

CREATE UNIQUE INDEX PERSON_EXCEL_ID on PERSON (EXCEL_ID);

DROP TRIGGER IF EXISTS LOG_PERSON;

CREATE TRIGGER LOG_PERSON BEFORE UPDATE ON PERSON
WHEN
    NEW.ID IS NOT NULL AND NEW.PASSWORD==OLD.PASSWORD
    
BEGIN
    INSERT INTO PERSON_HIST ( ID, EXCEL_ID, FIRST_NAME, LAST_NAME, INITIALS, EMAIL, IS_ACTIVE, IS_EMPLOYED, OFFICE_CODE, ROLE_CODE, COMPANY, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST, PROJECT_FACTOR, RANK_CODE, AGREEMENT_CODE, IS_FROM_POOL, SALARY, SALARY_RATE, LEAVE_RATE, CREATED, LAST_MOD, MODIFIED_BY, HIST_CREATED )
    VALUES ( OLD.ID, OLD.EXCEL_ID, OLD.FIRST_NAME, OLD.LAST_NAME, OLD.INITIALS, OLD.EMAIL, OLD.IS_ACTIVE, OLD.IS_EMPLOYED, OLD.OFFICE_CODE, OLD.ROLE_CODE, OLD.COMPANY, OLD.ACCOUNT, OLD.PHONE, OLD.POSITION, OLD.ADDRESS_STREET, OLD.ADDRESS_POST, OLD.PROJECT_FACTOR, OLD.RANK_CODE, OLD.AGREEMENT_CODE, OLD.IS_FROM_POOL, OLD.SALARY, OLD.SALARY_RATE, OLD.LEAVE_RATE, OLD.CREATED, OLD.LAST_MOD, OLD.MODIFIED_BY, STRFTIME('%s','NOW') );

    UPDATE PERSON
    SET LAST_MOD = STRFTIME('%s','NOW')
    WHERE ID = OLD.ID;
END;