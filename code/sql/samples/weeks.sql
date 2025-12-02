WITH RECURSIVE
    QUERY_PARAMS AS (
        SELECT "%s" PERIOD_DATE
    )

    , MONTH_PARAMS AS (
        SELECT
            DATE(PERIOD_DATE, 'start of month')                           AS MONTH_START,
            DATE(PERIOD_DATE, 'start of month', '+1 month', '-1 day')     AS MONTH_END,
            DATE(PERIOD_DATE, 'start of month', '-5 days')                AS MIN_RANGE,
            DATE(PERIOD_DATE, 'start of month', '+1 month', '-1 day', '+2 days')  AS MAX_RANGE
        FROM QUERY_PARAMS
    )

    , VALID_WEEKS AS (
        -- generate all Mondays that could be relevant (start from the Monday on/before month_start,
        -- stepping by 7 days). Each row represents a Monday->Sunday week.
        WITH RECURSIVE monday(m) AS (
            SELECT DATE((SELECT MONTH_START FROM MONTH_PARAMS), 'weekday 1', '-7 days')
            UNION ALL
            SELECT DATE(m, '+7 days') FROM monday
            WHERE m <= (SELECT MAX_RANGE FROM MONTH_PARAMS)
        )
        SELECT
            m AS WEEK_START,
            DATE(m, '+6 days') AS WEEK_END
        FROM monday
        WHERE WEEK_END <= (SELECT MAX_RANGE FROM MONTH_PARAMS)
        AND m > (SELECT MIN_RANGE FROM MONTH_PARAMS)
    )

    , VALID_WEEKS AS (
            -- Keep only weeks where at least one working day (Mon..Fri) is inside the target month.
            SELECT WA.WEEK_START, WA.WEEK_END
            FROM WEEKS_ALL WA
            JOIN MONTH_PARAMS MP ON 1=1
            WHERE EXISTS (
                SELECT 1
                FROM (
                    -- enumerate Mon..Fri of the week
                    SELECT DATE(WA.WEEK_START, '+0 days') AS d UNION ALL
                    SELECT DATE(WA.WEEK_START, '+1 days')       UNION ALL
                    SELECT DATE(WA.WEEK_START, '+2 days')       UNION ALL
                    SELECT DATE(WA.WEEK_START, '+3 days')       UNION ALL
                    SELECT DATE(WA.WEEK_START, '+4 days')
                ) wd
                WHERE wd.d BETWEEN MP.MONTH_START AND MP.MONTH_END
            )
        )

    SELECT * FROM VALID_WEEKS