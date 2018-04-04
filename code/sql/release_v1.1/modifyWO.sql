ALTER TABLE WORK_ORDER ADD COLUMN OFFICE_CODE VARCHAR (10);
ALTER TABLE WORK_ORDER ADD COLUMN IS_FROM_POOL VARCHAR (1) DEFAULT 'Y';
ALTER TABLE WORK_ORDER ADD COLUMN MODIFIED_BY INTEGER;


DROP TRIGGER IF EXISTS LOG_WO;
DROP TRIGGER IF EXISTS SET_TIMING_WORK_ORDER;
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


UPDATE WORK_ORDER SET OFFICE_CODE = ( 
    SELECT OFFICE_CODE FROM PERSON WHERE WORK_ORDER.VENTURE_ID = ID);

WITH WO_UNIQ AS (
    SELECT WO_ID, MIN(PERSON_ID) PERSON_ID FROM PERSON_WO GROUP BY WO_ID
),
PERSON_POOL AS (
    SELECT P.IS_FROM_POOL, WU.WO_ID FROM PERSON P JOIN WO_UNIQ WU ON P.ID = WU.PERSON_ID
)
UPDATE WORK_ORDER SET IS_FROM_POOL = (
    SELECT IS_FROM_POOL FROM PERSON_POOL WHERE WO_ID = ID 
);

UPDATE WORK_ORDER SET IS_FROM_POOL = (
    SELECT IS_FROM_POOL FROM WORK_TYPE WT WHERE WT.TYPE_CODE = TYPE_CODE AND WT.OFFICE_CODE = OFFICE_CODE AND WT.COMPLEXITY_CODE = COMPLEXITY_CODE
)
WHERE IS_FROM_POOL IS NULL;	
	
UPDATE WORK_ORDER SET MODIFIED_BY = 137;