ALTER TABLE WORK_TYPE ADD COLUMN DESCRIPTION VARCHAR (100);
ALTER TABLE WORK_TYPE ADD COLUMN IS_FROM_POOL VARCHAR (1);


INSERT INTO WORK_TYPE (OFFICE_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, PRICE)
SELECT "GDA", TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, PRICE
FROM WORK_TYPE
WHERE OFFICE_CODE = "POZ";


INSERT INTO WORK_TYPE (OFFICE_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, PRICE)
SELECT "CEN", TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, PRICE
FROM WORK_TYPE
WHERE OFFICE_CODE = "WAW";

UPDATE WORK_TYPE SET IS_FROM_POOL="Y";

UPDATE WORK_TYPE SET IS_FROM_POOL="N" 
	WHERE TYPE_CODE LIKE "0.%" OR TYPE_CODE = "OT" OR TYPE_CODE LIKE "2.%";
	
UPDATE WORK_TYPE 
    SET DESCRIPTION = (SELECT PARAM_CHARVAL FROM CODE_REFERENCE CR WHERE CR.CODE = WORK_TYPE.TYPE_CODE);

