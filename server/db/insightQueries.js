import { pool } from "./pool.js";

export async function getDatabaseDate() {
  const [rows] = await pool.execute(
    "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today",
  );
  return rows[0].today;
}

export async function getDashboardQueries(userId) {
  const weekCalendar = Array.from({ length: 7 }, (_, day) =>
    `SELECT DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL ${day} DAY) AS log_date`,
  ).join(" UNION ALL ");

  const [todayRows, weeklyRows, weeklyTotals, goalRows, activityRows, expenseRows] = await Promise.all([
    pool.execute(
      `SELECT DATE_FORMAT(today.log_date, '%Y-%m-%d') AS date,
              COALESCE(summary.total_spending, 0) AS spending,
              COALESCE(summary.study_minutes, 0) AS study_minutes,
              COALESCE(summary.screen_minutes, 0) AS screen_minutes,
              summary.mood_score,
              COALESCE(activity_counts.activity_count, 0) AS activity_count,
              ROUND(TIMESTAMPDIFF(SECOND, latest_sleep.sleep_start, latest_sleep.sleep_end) / 3600, 2) AS sleep_duration_hours,
              latest_sleep.quality_score AS sleep_quality
       FROM (SELECT CURDATE() AS log_date) AS today
       LEFT JOIN daily_summary AS summary
         ON summary.user_id = ? AND summary.log_date = today.log_date
       LEFT JOIN (
         SELECT logs.log_date, COUNT(activity.activity_id) AS activity_count
         FROM daily_logs AS logs
         LEFT JOIN activities AS activity ON activity.day_id = logs.day_id
         WHERE logs.user_id = ? AND logs.log_date = CURDATE()
         GROUP BY logs.log_date
       ) AS activity_counts ON activity_counts.log_date = today.log_date
       LEFT JOIN (
         SELECT sleep.sleep_start, sleep.sleep_end, sleep.quality_score
         FROM sleep_logs AS sleep
         INNER JOIN daily_logs AS logs ON logs.day_id = sleep.day_id
         WHERE logs.user_id = ?
         ORDER BY sleep.sleep_start DESC, sleep.sleep_id DESC
         LIMIT 1
       ) AS latest_sleep ON 1 = 1`,
      [userId, userId, userId],
    ),
    pool.execute(
      `SELECT DATE_FORMAT(calendar.log_date, '%Y-%m-%d') AS date,
              (SELECT COALESCE(SUM(expense.amount), 0)
               FROM expenses AS expense
               INNER JOIN daily_logs AS logs ON logs.day_id = expense.day_id
               WHERE logs.user_id = ? AND logs.log_date = calendar.log_date) AS spending,
              (SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)), 0)
               FROM study_sessions AS study
               INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
               WHERE logs.user_id = ? AND logs.log_date = calendar.log_date) AS study_seconds,
              (SELECT COALESCE(SUM(screen.duration_minutes), 0)
               FROM screen_time_logs AS screen
               INNER JOIN daily_logs AS logs ON logs.day_id = screen.day_id
               WHERE logs.user_id = ? AND logs.log_date = calendar.log_date) AS screen_minutes
       FROM (${weekCalendar}) AS calendar
       ORDER BY calendar.log_date`,
      [userId, userId, userId],
    ),
    pool.execute(
      `SELECT COALESCE(MAX(total_spending), 0) AS spending
       FROM weekly_expense_summary
       WHERE user_id = ? AND year_week = YEARWEEK(CURDATE(), 1)`,
      [userId],
    ),
    pool.execute(
      `SELECT goal.goal_id, goal.goal_name, goal.goal_type, goal.target_value, goal.unit,
              goal.start_date, goal.end_date, goal.status,
              latest.actual_value AS current_value,
              DATE_FORMAT(latest.progress_date, '%Y-%m-%d') AS progress_date
       FROM goals AS goal
       LEFT JOIN goal_progress AS latest
         ON latest.goal_id = goal.goal_id
         AND latest.progress_date = (
           SELECT MAX(progress.progress_date)
           FROM goal_progress AS progress
           WHERE progress.goal_id = goal.goal_id
         )
       WHERE goal.user_id = ? AND goal.status = 'Active'
       ORDER BY goal.goal_id`,
      [userId],
    ),
    pool.execute(
      `SELECT activity.activity_id, activity.activity_name, activity.description,
              activity.start_time, activity.end_time, category.category_name,
              location.location_name,
              DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS log_date
       FROM activities AS activity
       INNER JOIN daily_logs AS logs ON logs.day_id = activity.day_id
       INNER JOIN activity_categories AS category ON category.category_id = activity.category_id
       LEFT JOIN locations AS location
         ON location.location_id = activity.location_id AND location.user_id = logs.user_id
       WHERE logs.user_id = ?
       ORDER BY activity.start_time DESC, activity.activity_id DESC
       LIMIT 5`,
      [userId],
    ),
    pool.execute(
      `SELECT expense.expense_id, expense.category, expense.amount,
              expense.payment_method, expense.description,
              DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS log_date
       FROM expenses AS expense
       INNER JOIN daily_logs AS logs ON logs.day_id = expense.day_id
       WHERE logs.user_id = ?
       ORDER BY logs.log_date DESC, expense.expense_id DESC
       LIMIT 5`,
      [userId],
    ),
  ]);

  return {
    today: todayRows[0][0],
    week: weeklyRows[0],
    weeklySpending: weeklyTotals[0][0].spending,
    goals: goalRows[0],
    activities: activityRows[0],
    expenses: expenseRows[0],
  };
}

export async function getAnalyticsQueries(userId, from, to) {
  const scopedRange = [userId, from, to];
  const queries = [
    pool.execute(
      `SELECT expense.category, SUM(expense.amount) AS amount
       FROM expenses AS expense
       INNER JOIN daily_logs AS logs ON logs.day_id = expense.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY expense.category ORDER BY amount DESC, expense.category`,
      scopedRange,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS date, SUM(expense.amount) AS amount
       FROM expenses AS expense
       INNER JOIN daily_logs AS logs ON logs.day_id = expense.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY logs.log_date ORDER BY logs.log_date`,
      scopedRange,
    ),
    pool.execute(
      `SELECT study.subject,
              SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)) AS study_seconds,
              COUNT(*) AS session_count
       FROM study_sessions AS study
       INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY study.subject ORDER BY study_seconds DESC, study.subject`,
      scopedRange,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS date,
              SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)) AS study_seconds
       FROM study_sessions AS study
       INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY logs.log_date ORDER BY logs.log_date`,
      scopedRange,
    ),
    pool.execute(
      `SELECT study.subject, AVG(study.productivity_rating) AS average_rating,
              COUNT(study.productivity_rating) AS rated_sessions
       FROM study_sessions AS study
       INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY study.subject ORDER BY average_rating DESC, study.subject`,
      scopedRange,
    ),
    pool.execute(
      `SELECT screen.application_name, SUM(screen.duration_minutes) AS minutes
       FROM screen_time_logs AS screen
       INNER JOIN daily_logs AS logs ON logs.day_id = screen.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY screen.application_name ORDER BY minutes DESC, screen.application_name`,
      scopedRange,
    ),
    pool.execute(
      `SELECT COALESCE(screen.category, 'Uncategorized') AS category,
              SUM(screen.duration_minutes) AS minutes
       FROM screen_time_logs AS screen
       INNER JOIN daily_logs AS logs ON logs.day_id = screen.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY COALESCE(screen.category, 'Uncategorized') ORDER BY minutes DESC, category`,
      scopedRange,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS date,
              AVG(mood.mood_score) AS average_score, COUNT(*) AS entry_count
       FROM mood_logs AS mood
       INNER JOIN daily_logs AS logs ON logs.day_id = mood.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY logs.log_date ORDER BY logs.log_date`,
      scopedRange,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS date,
              SUM(TIMESTAMPDIFF(SECOND, sleep.sleep_start, sleep.sleep_end)) AS sleep_seconds,
              AVG(sleep.quality_score) AS average_quality, COUNT(*) AS sleep_count
       FROM sleep_logs AS sleep
       INNER JOIN daily_logs AS logs ON logs.day_id = sleep.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY logs.log_date ORDER BY logs.log_date`,
      scopedRange,
    ),
    pool.execute(
      `SELECT category.category_name AS category,
              SUM(TIMESTAMPDIFF(SECOND, activity.start_time, activity.end_time)) AS activity_seconds,
              COUNT(*) AS activity_count
       FROM activities AS activity
       INNER JOIN daily_logs AS logs ON logs.day_id = activity.day_id
       INNER JOIN activity_categories AS category ON category.category_id = activity.category_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY category.category_name ORDER BY activity_seconds DESC, category`,
      scopedRange,
    ),
    pool.execute(
      `SELECT COALESCE(location.location_name, 'Unspecified') AS location,
              SUM(TIMESTAMPDIFF(SECOND, activity.start_time, activity.end_time)) AS activity_seconds,
              COUNT(*) AS visit_count
       FROM activities AS activity
       INNER JOIN daily_logs AS logs ON logs.day_id = activity.day_id
       LEFT JOIN locations AS location
         ON location.location_id = activity.location_id AND location.user_id = logs.user_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY COALESCE(location.location_name, 'Unspecified')
       ORDER BY visit_count DESC, activity_seconds DESC, location`,
      scopedRange,
    ),
    pool.execute(
      `SELECT transport.mode, SUM(COALESCE(transport.duration_minutes, 0)) AS duration_minutes,
              SUM(COALESCE(transport.distance_km, 0)) AS distance_km
       FROM transport_logs AS transport
       INNER JOIN daily_logs AS logs ON logs.day_id = transport.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY transport.mode ORDER BY duration_minutes DESC, transport.mode`,
      scopedRange,
    ),
    pool.execute(
      `SELECT food.meal_type, SUM(COALESCE(food.cost, 0)) AS amount
       FROM food_logs AS food
       INNER JOIN daily_logs AS logs ON logs.day_id = food.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY food.meal_type ORDER BY amount DESC, food.meal_type`,
      scopedRange,
    ),
    pool.execute(
      `SELECT DAYOFWEEK(logs.log_date) AS day_of_week,
              AVG(study.productivity_rating) AS average_rating,
              COUNT(study.productivity_rating) AS rated_sessions,
              SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)) AS study_seconds
       FROM study_sessions AS study
       INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY DAYOFWEEK(logs.log_date) ORDER BY day_of_week`,
      scopedRange,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(calendar.log_date, '%Y-%m-%d') AS date,
              study_rows.study_seconds, study_rows.average_productivity,
              sleep_rows.sleep_seconds
       FROM (
         SELECT DISTINCT log_date FROM daily_logs
         WHERE user_id = ? AND log_date BETWEEN ? AND ?
       ) AS calendar
       LEFT JOIN (
         SELECT logs.log_date,
                SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)) AS study_seconds,
                AVG(study.productivity_rating) AS average_productivity
         FROM study_sessions AS study
         INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
         WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
         GROUP BY logs.log_date
       ) AS study_rows ON study_rows.log_date = calendar.log_date
       LEFT JOIN (
         SELECT logs.log_date,
                SUM(TIMESTAMPDIFF(SECOND, sleep.sleep_start, sleep.sleep_end)) AS sleep_seconds
         FROM sleep_logs AS sleep
         INNER JOIN daily_logs AS logs ON logs.day_id = sleep.day_id
         WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
         GROUP BY logs.log_date
       ) AS sleep_rows ON sleep_rows.log_date = calendar.log_date
       WHERE study_rows.study_seconds IS NOT NULL OR sleep_rows.sleep_seconds IS NOT NULL
       ORDER BY calendar.log_date`,
      [...scopedRange, ...scopedRange, ...scopedRange],
    ),
  ];
  const results = await Promise.all(queries);
  return results.map(([rows]) => rows);
}

export async function getProgressQueries(userId, from, to) {
  const range = [userId, from, to];
  const results = await Promise.all([
    pool.execute(
      `SELECT goal.goal_id, goal.goal_name, goal.goal_type, goal.target_value, goal.unit,
              goal.status, goal.start_date, goal.end_date,
              current_progress.actual_value AS current_value,
              DATE_FORMAT(current_progress.progress_date, '%Y-%m-%d') AS current_progress_date,
              range_progress.actual_value AS range_value,
              DATE_FORMAT(range_progress.progress_date, '%Y-%m-%d') AS range_progress_date
       FROM goals AS goal
       LEFT JOIN goal_progress AS current_progress
         ON current_progress.goal_id = goal.goal_id
         AND current_progress.progress_date = (
           SELECT MAX(progress.progress_date)
           FROM goal_progress AS progress
           WHERE progress.goal_id = goal.goal_id AND progress.progress_date <= ?
         )
       LEFT JOIN goal_progress AS range_progress
         ON range_progress.goal_id = goal.goal_id
         AND range_progress.progress_date = (
           SELECT MAX(progress.progress_date)
           FROM goal_progress AS progress
           WHERE progress.goal_id = goal.goal_id AND progress.progress_date BETWEEN ? AND ?
         )
       WHERE goal.user_id = ? ORDER BY goal.goal_id`,
      [to, from, to, userId],
    ),
    pool.execute(
      `SELECT COALESCE(SUM(expense.amount), 0) AS amount
       FROM expenses AS expense
       INNER JOIN daily_logs AS logs ON logs.day_id = expense.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?`,
      range,
    ),
    pool.execute(
      `SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)), 0) AS study_seconds,
              AVG(study.productivity_rating) AS average_productivity,
              COUNT(*) AS session_count,
              COUNT(study.productivity_rating) AS rated_sessions
       FROM study_sessions AS study
       INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?`,
      range,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(logs.log_date, '%Y-%m-%d') AS date,
              SUM(TIMESTAMPDIFF(SECOND, study.start_time, study.end_time)) AS study_seconds
       FROM study_sessions AS study
       INNER JOIN daily_logs AS logs ON logs.day_id = study.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY logs.log_date ORDER BY logs.log_date`,
      range,
    ),
    pool.execute(
      `SELECT COUNT(*) AS activity_count,
              COALESCE(SUM(TIMESTAMPDIFF(SECOND, activity.start_time, activity.end_time)), 0) AS activity_seconds,
              COALESCE(SUM(CASE WHEN LOWER(category.category_name) LIKE '%exercise%'
                                THEN TIMESTAMPDIFF(SECOND, activity.start_time, activity.end_time) ELSE 0 END), 0) AS exercise_seconds,
              COALESCE(SUM(CASE WHEN LOWER(category.category_name) LIKE '%exercise%' THEN 1 ELSE 0 END), 0) AS exercise_count
       FROM activities AS activity
       INNER JOIN daily_logs AS logs ON logs.day_id = activity.day_id
       INNER JOIN activity_categories AS category ON category.category_id = activity.category_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?`,
      range,
    ),
    pool.execute(
      `SELECT category.category_name AS category,
              COUNT(*) AS activity_count,
              SUM(TIMESTAMPDIFF(SECOND, activity.start_time, activity.end_time)) AS activity_seconds
       FROM activities AS activity
       INNER JOIN daily_logs AS logs ON logs.day_id = activity.day_id
       INNER JOIN activity_categories AS category ON category.category_id = activity.category_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY category.category_name ORDER BY activity_seconds DESC, category`,
      range,
    ),
    pool.execute(
      `SELECT COALESCE(SUM(screen.duration_minutes), 0) AS screen_minutes
       FROM screen_time_logs AS screen
       INNER JOIN daily_logs AS logs ON logs.day_id = screen.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?`,
      range,
    ),
    pool.execute(
      `SELECT screen.application_name, SUM(screen.duration_minutes) AS minutes
       FROM screen_time_logs AS screen
       INNER JOIN daily_logs AS logs ON logs.day_id = screen.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY screen.application_name ORDER BY minutes DESC, screen.application_name`,
      range,
    ),
    pool.execute(
      `SELECT COALESCE(screen.category, 'Uncategorized') AS category,
              SUM(screen.duration_minutes) AS minutes
       FROM screen_time_logs AS screen
       INNER JOIN daily_logs AS logs ON logs.day_id = screen.day_id
       WHERE logs.user_id = ? AND logs.log_date BETWEEN ? AND ?
       GROUP BY COALESCE(screen.category, 'Uncategorized') ORDER BY minutes DESC, category`,
      range,
    ),
    pool.execute(
      `SELECT goal.goal_id, goal.goal_name, goal.target_value, goal.unit,
              goal.start_date, goal.end_date,
              COALESCE(SUM(expense.amount), 0) AS spent_amount
       FROM goals AS goal
       LEFT JOIN daily_logs AS logs
         ON logs.user_id = goal.user_id
         AND logs.log_date BETWEEN ? AND ?
         AND (goal.start_date IS NULL OR logs.log_date >= goal.start_date)
         AND (goal.end_date IS NULL OR logs.log_date <= goal.end_date)
       LEFT JOIN expenses AS expense ON expense.day_id = logs.day_id
       WHERE goal.user_id = ? AND LOWER(COALESCE(goal.goal_type, '')) = 'budget'
       GROUP BY goal.goal_id, goal.goal_name, goal.target_value, goal.unit, goal.start_date, goal.end_date
       ORDER BY goal.goal_id`,
      [from, to, userId],
    ),
  ]);

  const [goalRows, spendingRows, studyTotals, studyByDay, activityTotals, activityCategories,
    screenTotals, screenApplications, screenCategories, budgetRows] = results;

  return {
    goals: goalRows[0],
    spending: Number(spendingRows[0][0].amount),
    study: studyTotals[0][0],
    studyByDay: studyByDay[0],
    activity: activityTotals[0][0],
    activityCategories: activityCategories[0],
    screen: screenTotals[0][0],
    screenApplications: screenApplications[0],
    screenCategories: screenCategories[0],
    budgets: budgetRows[0],
  };
}