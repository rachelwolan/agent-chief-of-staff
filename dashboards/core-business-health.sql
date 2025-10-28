-- ============================================
-- CORE BUSINESS HEALTH DASHBOARD
-- Source: report__kpi_daily in Snowflake
-- ============================================

-- Query 1: Yesterday's Growth Metrics Summary
-- ============================================
SELECT
    date_day,
    -- Total Signups
    sign_ups AS total_signups,

    -- Signup Attribution Split
    sign_ups_paid AS signups_paid,
    sign_ups_organic AS signups_organic,
    ROUND(sign_ups_paid::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_paid,
    ROUND(sign_ups_organic::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_organic,

    -- Onboarding Completion
    sign_ups_completed_onboarding_survey AS completed_onboarding,
    ROUND(sign_ups_completed_onboarding_survey::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS onboarding_completion_rate,

    -- First Site Creation
    users_created_first_site,
    ROUND(users_created_first_site::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS first_site_creation_rate,

    -- First-Time Conversions
    first_user_conversions AS total_ftc,
    first_user_conversions_7_days AS ftc_7d,
    first_user_conversions_30_days AS ftc_30d,

    -- FTC MRR
    mrr_from_ftc_purchase_unb AS ftc_mrr_total,
    mrr_from_ftc_purchase_7_days AS ftc_mrr_7d,
    mrr_from_ftc_purchase_30_days AS ftc_mrr_30d
FROM
    analytics.webflow.report__kpi_daily
WHERE
    date_day = CURRENT_DATE - 1  -- Yesterday
ORDER BY
    date_day DESC;


-- Query 2: Last 7 Days Trend
-- ============================================
SELECT
    date_day,
    sign_ups AS total_signups,
    sign_ups_paid,
    sign_ups_organic,
    users_created_first_site,
    first_user_conversions,
    first_user_conversions_7_days AS ftc_7d,
    first_user_conversions_30_days AS ftc_30d
FROM
    analytics.webflow.report__kpi_daily
WHERE
    date_day >= CURRENT_DATE - 7
    AND date_day < CURRENT_DATE
ORDER BY
    date_day DESC;


-- Query 3: Week-over-Week Comparison
-- ============================================
WITH this_week AS (
    SELECT
        SUM(sign_ups) AS signups,
        SUM(sign_ups_paid) AS signups_paid,
        SUM(sign_ups_organic) AS signups_organic,
        SUM(users_created_first_site) AS first_sites,
        SUM(first_user_conversions) AS ftc_total,
        SUM(first_user_conversions_7_days) AS ftc_7d,
        SUM(first_user_conversions_30_days) AS ftc_30d
    FROM analytics.webflow.report__kpi_daily
    WHERE date_day >= DATEADD(day, -7, CURRENT_DATE)
      AND date_day < CURRENT_DATE
),
last_week AS (
    SELECT
        SUM(sign_ups) AS signups,
        SUM(sign_ups_paid) AS signups_paid,
        SUM(sign_ups_organic) AS signups_organic,
        SUM(users_created_first_site) AS first_sites,
        SUM(first_user_conversions) AS ftc_total,
        SUM(first_user_conversions_7_days) AS ftc_7d,
        SUM(first_user_conversions_30_days) AS ftc_30d
    FROM analytics.webflow.report__kpi_daily
    WHERE date_day >= DATEADD(day, -14, CURRENT_DATE)
      AND date_day < DATEADD(day, -7, CURRENT_DATE)
)
SELECT
    'Signups' AS metric,
    tw.signups AS this_week,
    lw.signups AS last_week,
    tw.signups - lw.signups AS change,
    ROUND((tw.signups - lw.signups)::FLOAT / NULLIF(lw.signups, 0) * 100, 1) AS pct_change
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'Signups (Paid)',
    tw.signups_paid,
    lw.signups_paid,
    tw.signups_paid - lw.signups_paid,
    ROUND((tw.signups_paid - lw.signups_paid)::FLOAT / NULLIF(lw.signups_paid, 0) * 100, 1)
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'Signups (Organic)',
    tw.signups_organic,
    lw.signups_organic,
    tw.signups_organic - lw.signups_organic,
    ROUND((tw.signups_organic - lw.signups_organic)::FLOAT / NULLIF(lw.signups_organic, 0) * 100, 1)
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'First Sites Created',
    tw.first_sites,
    lw.first_sites,
    tw.first_sites - lw.first_sites,
    ROUND((tw.first_sites - lw.first_sites)::FLOAT / NULLIF(lw.first_sites, 0) * 100, 1)
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'First-Time Conversions',
    tw.ftc_total,
    lw.ftc_total,
    tw.ftc_total - lw.ftc_total,
    ROUND((tw.ftc_total - lw.ftc_total)::FLOAT / NULLIF(lw.ftc_total, 0) * 100, 1)
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'FTC (7-day cohort)',
    tw.ftc_7d,
    lw.ftc_7d,
    tw.ftc_7d - lw.ftc_7d,
    ROUND((tw.ftc_7d - lw.ftc_7d)::FLOAT / NULLIF(lw.ftc_7d, 0) * 100, 1)
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'FTC (30-day cohort)',
    tw.ftc_30d,
    lw.ftc_30d,
    tw.ftc_30d - lw.ftc_30d,
    ROUND((tw.ftc_30d - lw.ftc_30d)::FLOAT / NULLIF(lw.ftc_30d, 0) * 100, 1)
FROM this_week tw, last_week lw;


-- Query 4: Last 30 Days Daily Trend (for charts)
-- ============================================
SELECT
    date_day,
    sign_ups,
    sign_ups_paid,
    sign_ups_organic,
    users_created_first_site,
    first_user_conversions,
    ROUND(users_created_first_site::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS activation_rate,
    ROUND(first_user_conversions::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS conversion_rate
FROM
    analytics.webflow.report__kpi_daily
WHERE
    date_day >= CURRENT_DATE - 30
    AND date_day < CURRENT_DATE
ORDER BY
    date_day ASC;


-- Query 5: Conversion Funnel Analysis
-- ============================================
SELECT
    date_day,
    sign_ups AS step_1_signups,
    sign_ups_completed_onboarding_survey AS step_2_onboarding,
    users_created_first_site AS step_3_first_site,
    first_user_conversions_7_days AS step_4_ftc_7d,

    -- Conversion rates between stages
    ROUND(sign_ups_completed_onboarding_survey::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS signup_to_onboarding_pct,
    ROUND(users_created_first_site::FLOAT / NULLIF(sign_ups_completed_onboarding_survey, 0) * 100, 1) AS onboarding_to_site_pct,
    ROUND(first_user_conversions_7_days::FLOAT / NULLIF(users_created_first_site, 0) * 100, 1) AS site_to_conversion_pct
FROM
    analytics.webflow.report__kpi_daily
WHERE
    date_day >= CURRENT_DATE - 30
    AND date_day < CURRENT_DATE
ORDER BY
    date_day DESC;


-- Query 6: Paid vs Organic Performance
-- ============================================
WITH daily_metrics AS (
    SELECT
        date_day,
        sign_ups_paid,
        sign_ups_organic,
        users_created_first_site,
        first_user_conversions_7_days AS ftc_7d
    FROM analytics.webflow.report__kpi_daily
    WHERE date_day >= CURRENT_DATE - 30
      AND date_day < CURRENT_DATE
)
SELECT
    'Last 30 Days' AS period,
    SUM(sign_ups_paid) AS paid_signups,
    SUM(sign_ups_organic) AS organic_signups,
    SUM(sign_ups_paid + sign_ups_organic) AS total_signups,
    ROUND(SUM(sign_ups_paid)::FLOAT / NULLIF(SUM(sign_ups_paid + sign_ups_organic), 0) * 100, 1) AS pct_paid,
    ROUND(SUM(sign_ups_organic)::FLOAT / NULLIF(SUM(sign_ups_paid + sign_ups_organic), 0) * 100, 1) AS pct_organic
FROM daily_metrics;
