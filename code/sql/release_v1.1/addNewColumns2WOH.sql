ALTER TABLE WORK_ORDER_HIST ADD COLUMN CREATED INTEGER;
ALTER TABLE WORK_ORDER_HIST ADD COLUMN PROTOCOL_NO VARCHAR(255);
ALTER TABLE WORK_ORDER_HIST ADD COLUMN ITEM_ID INTEGER;
ALTER TABLE WORK_ORDER_HIST ADD COLUMN VENTURE_ID INTEGER;


DROP TRIGGER IF EXISTS LOG_WO;

CREATE TRIGGER LOG_WO BEFORE UPDATE ON WORK_ORDER
WHEN
    OLD.STATUS_CODE <> NEW.STATUS_CODE
BEGIN
    INSERT INTO WORK_ORDER_HIST ( ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMMENT, MD_CAPEX, PROTOCOL_NO, DESCRIPTION, COMPLEXITY_CODE, COMPLEXITY, PRICE, ITEM_ID, VENTURE_ID, CREATED, LAST_MOD, HIST_CREATE )
    VALUES ( OLD.ID, OLD.WORK_NO, OLD.STATUS_CODE, OLD.TYPE_CODE, OLD.COMMENT, OLD.MD_CAPEX, OLD.PROTOCOL_NO, OLD.DESCRIPTION, OLD.COMPLEXITY_CODE, OLD.COMPLEXITY, OLD.PRICE, OLD.ITEM_ID, OLD.VENTURE_ID, OLD.CREATED, OLD.LAST_MOD, STRFTIME('%s','NOW') );
    
    UPDATE WORK_ORDER 
    SET LAST_MOD = STRFTIME('%s','NOW')
    WHERE ID = OLD.ID;
END;