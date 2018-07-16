DROP TRIGGER IF EXISTS LOG_PERSON;

CREATE TRIGGER LOG_PERSON BEFORE UPDATE ON PERSON
WHEN
    NEW.ID IS NOT NULL AND (OLD.EMAIL <> NEW.EMAIL OR OLD.IS_ACTIVE <> NEW.IS_ACTIVE OR OLD.IS_EMPLOYED <> NEW.IS_EMPLOYED OR OLD.OFFICE_CODE <> NEW.OFFICE_CODE OR OLD.ROLE_CODE <> NEW.ROLE_CODE OR OLD.RANK_CODE <> NEW.RANK_CODE OR OLD.COMPANY <> NEW.COMPANY OR OLD.ACCOUNT <> NEW.ACCOUNT OR OLD.PHONE <> NEW.PHONE OR OLD.POSITION <> NEW.POSITION OR OLD.ADDRESS_STREET <> NEW.ADDRESS_STREET OR OLD.ADDRESS_POST <> NEW.ADDRESS_POST OR OLD.PROJECT_FACTOR <> NEW.PROJECT_FACTOR OR OLD.IS_FROM_POOL <> NEW.IS_FROM_POOL OR OLD.AGREEMENT_CODE <> NEW.AGREEMENT_CODE OR OLD.SALARY <> NEW.SALARY OR OLD.SALARY_RATE <> NEW.SALARY_RATE OR OLD.LEAVE_RATE <> NEW.LEAVE_RATE OR OLD.EXCEL_ID <> NEW.EXCEL_ID  )
    
BEGIN
    INSERT INTO PERSON_HIST ( ID, EXCEL_ID, FIRST_NAME, LAST_NAME, INITIALS, EMAIL, IS_ACTIVE, IS_EMPLOYED, OFFICE_CODE, ROLE_CODE, COMPANY, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST, PROJECT_FACTOR, RANK_CODE, AGREEMENT_CODE, IS_FROM_POOL, SALARY, SALARY_RATE, LEAVE_RATE, CREATED, LAST_MOD, MODIFIED_BY, HIST_CREATED )
    VALUES ( OLD.ID, OLD.EXCEL_ID, OLD.FIRST_NAME, OLD.LAST_NAME, OLD.INITIALS, OLD.EMAIL, OLD.IS_ACTIVE, OLD.IS_EMPLOYED, OLD.OFFICE_CODE, OLD.ROLE_CODE, OLD.COMPANY, OLD.ACCOUNT, OLD.PHONE, OLD.POSITION, OLD.ADDRESS_STREET, OLD.ADDRESS_POST, OLD.PROJECT_FACTOR, OLD.RANK_CODE, OLD.AGREEMENT_CODE, OLD.IS_FROM_POOL, OLD.SALARY, OLD.SALARY_RATE, OLD.LEAVE_RATE, OLD.CREATED, OLD.LAST_MOD, OLD.MODIFIED_BY, STRFTIME('%s','NOW') );

    UPDATE PERSON
    SET LAST_MOD = STRFTIME('%s','NOW')
    WHERE ID = OLD.ID;
END;