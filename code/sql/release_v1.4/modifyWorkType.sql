ALTER TABLE WORK_TYPE ADD COLUMN COLOR VARCHAR(10) DEFAULT '#000000';

UPDATE WORK_TYPE SET COLOR='#808080' WHERE TYPE_CODE='OT';
UPDATE WORK_TYPE SET COLOR='#A9A9A9' WHERE TYPE_CODE='IN';

UPDATE WORK_TYPE SET COLOR='#D1E0E0' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '0.';
UPDATE WORK_TYPE SET COLOR='#FFFFAA' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '1.';
UPDATE WORK_TYPE SET COLOR='#FFFF00' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '2.';
UPDATE WORK_TYPE SET COLOR='#FFA500' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '3.';
UPDATE WORK_TYPE SET COLOR='#B3FFFF' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '4.';
UPDATE WORK_TYPE SET COLOR='#66A3FF' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '5.';
UPDATE WORK_TYPE SET COLOR='#00CCCC' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '6.';
UPDATE WORK_TYPE SET COLOR='#0066FF' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '7.';
UPDATE WORK_TYPE SET COLOR='#FFCCFF' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '8.';
UPDATE WORK_TYPE SET COLOR='#D9B3FF' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '9.';
UPDATE WORK_TYPE SET COLOR='#800080' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '10.';
UPDATE WORK_TYPE SET COLOR='#88CC00' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '11.';
UPDATE WORK_TYPE SET COLOR='#CC0088' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '12.';
UPDATE WORK_TYPE SET COLOR='#FF0000' WHERE INSTR(TYPE_CODE,'.') AND SUBSTR(TYPE_CODE,1,INSTR(TYPE_CODE,'.')) = '13.';