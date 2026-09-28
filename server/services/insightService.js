import {
  getAnalyticsQueries,
  getDashboardQueries,
  getDatabaseDate,
  getProgressQueries,
} from "../db/insightQueries.js";
import { resolveAnalyticsRange, resolveProgressRange } from "../validators/insightValidators.js";

function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function percentage(value, total) {
  return total > 0 ? round((value / total) * 100) : 0;
}

function hoursFromSeconds(value) {
  return round((numeric(value) ?? 0) / 3600);
}

function pearson(rows, xKey, yKey) {
  const pairs = rows
    .map((row) => [numeric(row[xKey]), numeric(row[yKey])])
    .filter(([x, y]) => x !== null && y !== null);
  if (pairs.length < 2) return null;
  const meanX = pairs.reduce((sum, [x]) => sum + x, 0) / pairs.length;
  const meanY = pairs.reduce((sum, [, y]) => sum + y, 0) / pairs.length;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (const [x, y] of pairs) {
    covariance += (x - meanX) * (y - meanY);
    varianceX += (x - meanX) ** 2;
    varianceY += (y - meanY) ** 2;
  }
  if (!varianceX || !varianceY) return null;
  return round(covariance / Math.sqrt(varianceX * varianceY), 3);
}

function bestRow(rows, valueSelector) {
  if (!rows.length) return null;
  return rows.reduce((best, row) => valueSelector(row) > valueSelector(best) ? row : best);
}

export async function getDashboard(userId) {
  const result = await getDashboardQueries(userId);
  const today = result.today;
  const week = result.week.map((row) => ({
    date: row.date,
    spending: numeric(row.spending) ?? 0,
    studyHours: hoursFromSeconds(row.study_seconds),
    screenTimeMinutes: numeric(row.screen_minutes) ?? 0,
  }));
  const activeGoals = result.goals.map((goal) => {
    const currentValue = numeric(goal.current_value);
    const targetValue = numeric(goal.target_value);
    return {
      goalId: goal.goal_id,
      goalName: goal.goal_name,
      goalType: goal.goal_type,
      targetValue,
      currentValue,
      progressDate: goal.progress_date,
      unit: goal.unit,
      status: goal.status,
      progressPercent: targetValue > 0 && currentValue !== null
        ? round(Math.min((currentValue / targetValue) * 100, 100))
        : null,
    };
  });
  const weeklyTotals = week.reduce((totals, row) => ({
    spending: totals.spending + row.spending,
    studyHours: totals.studyHours + row.studyHours,
    screenTimeMinutes: totals.screenTimeMinutes + row.screenTimeMinutes,
  }), { spending: 0, studyHours: 0, screenTimeMinutes: 0 });

  return {
    summary: {
      date: today.date,
      today: {
        activityCount: numeric(today.activity_count) ?? 0,
        studyHours: round((numeric(today.study_minutes) ?? 0) / 60),
        spending: numeric(today.spending) ?? 0,
        screenTimeMinutes: numeric(today.screen_minutes) ?? 0,
        moodScore: numeric(today.mood_score),
        latestSleep: today.sleep_duration_hours === null ? null : {
          durationHours: numeric(today.sleep_duration_hours),
          qualityScore: numeric(today.sleep_quality),
        },
      },
      weekly: {
        spending: numeric(result.weeklySpending) ?? round(weeklyTotals.spending),
        studyHours: round(weeklyTotals.studyHours),
        screenTimeMinutes: round(weeklyTotals.screenTimeMinutes),
      },
    },
    activeGoals,
    recentActivities: result.activities,
    recentExpenses: result.expenses,
    charts: {
      weeklySpending: week.map(({ date, spending }) => ({ date, amount: spending })),
      weeklyStudyHours: week.map(({ date, studyHours }) => ({ date, hours: studyHours })),
      weeklyScreenTime: week.map(({ date, screenTimeMinutes }) => ({ date, minutes: screenTimeMinutes })),
    },
  };
}

export async function getAnalytics(userId, query) {
  const today = await getDatabaseDate();
  const range = resolveAnalyticsRange(query, today);
  const [
    spendingCategoryRows,
    spendingDayRows,
    studySubjectRows,
    studyDayRows,
    productivitySubjectRows,
    screenApplicationRows,
    screenCategoryRows,
    moodRows,
    sleepRows,
    activityCategoryRows,
    activityLocationRows,
    transportRows,
    foodRows,
    weekdayRows,
    relationshipRows,
  ] = await getAnalyticsQueries(userId, range.from, range.to);

  const totalSpending = spendingCategoryRows.reduce((sum, row) => sum + (numeric(row.amount) ?? 0), 0);
  const totalActivitySeconds = activityCategoryRows.reduce((sum, row) => sum + (numeric(row.activity_seconds) ?? 0), 0);
  const spendingByCategory = spendingCategoryRows.map((row) => {
    const amount = numeric(row.amount) ?? 0;
    return { category: row.category, amount, percentage: percentage(amount, totalSpending) };
  });
  const studyBySubject = studySubjectRows.map((row) => ({
    subject: row.subject,
    hours: hoursFromSeconds(row.study_seconds),
    sessionCount: numeric(row.session_count) ?? 0,
  }));
  const productivityBySubject = productivitySubjectRows.map((row) => ({
    subject: row.subject,
    averageRating: round(numeric(row.average_rating)),
    ratedSessions: numeric(row.rated_sessions) ?? 0,
  }));
  const screenTimeByApp = screenApplicationRows.map((row) => ({
    applicationName: row.application_name,
    minutes: numeric(row.minutes) ?? 0,
  }));
  const screenTimeByCategory = screenCategoryRows.map((row) => ({
    category: row.category,
    minutes: numeric(row.minutes) ?? 0,
  }));
  const activityByCategory = activityCategoryRows.map((row) => {
    const seconds = numeric(row.activity_seconds) ?? 0;
    return {
      category: row.category,
      hours: round(seconds / 3600),
      activityCount: numeric(row.activity_count) ?? 0,
      percentage: percentage(seconds, totalActivitySeconds),
    };
  });
  const activityByLocation = activityLocationRows.map((row) => ({
    location: row.location,
    hours: hoursFromSeconds(row.activity_seconds),
    visitCount: numeric(row.visit_count) ?? 0,
  }));
  const transportByMode = transportRows.map((row) => ({
    mode: row.mode,
    minutes: numeric(row.duration_minutes) ?? 0,
    distanceKm: round(numeric(row.distance_km) ?? 0),
  }));
  const moodTrend = moodRows.map((row) => ({
    date: row.date,
    averageScore: round(numeric(row.average_score)),
    entryCount: numeric(row.entry_count) ?? 0,
  }));
  const sleepTrend = sleepRows.map((row) => ({
    date: row.date,
    durationHours: hoursFromSeconds(row.sleep_seconds),
    averageQuality: round(numeric(row.average_quality)),
    sleepCount: numeric(row.sleep_count) ?? 0,
  }));
  const studyByDay = studyDayRows.map((row) => ({ date: row.date, hours: hoursFromSeconds(row.study_seconds) }));
  const spendingByDay = spendingDayRows.map((row) => ({ date: row.date, amount: numeric(row.amount) ?? 0 }));
  const productivityByDayOfWeek = weekdayRows.map((row) => ({
    dayOfWeek: ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][numeric(row.day_of_week)],
    dayOfWeekIndex: numeric(row.day_of_week),
    averageRating: round(numeric(row.average_rating)),
    ratedSessions: numeric(row.rated_sessions) ?? 0,
    studyHours: hoursFromSeconds(row.study_seconds),
  }));
  const foodSpendingByMeal = foodRows.map((row) => ({ mealType: row.meal_type, amount: numeric(row.amount) ?? 0 }));
  const dailyRelationships = relationshipRows.map((row) => ({
    date: row.date,
    studyHours: row.study_seconds === null ? null : hoursFromSeconds(row.study_seconds),
    averageProductivity: round(numeric(row.average_productivity)),
    sleepHours: row.sleep_seconds === null ? null : hoursFromSeconds(row.sleep_seconds),
  }));

  const totalStudyHours = studyBySubject.reduce((sum, row) => sum + row.hours, 0);
  const totalScreenMinutes = screenTimeByApp.reduce((sum, row) => sum + row.minutes, 0);
  const totalSessions = productivityBySubject.reduce((sum, row) => sum + row.ratedSessions, 0);
  const weightedProductivity = productivityBySubject.reduce(
    (sum, row) => sum + (row.averageRating ?? 0) * row.ratedSessions,
    0,
  );
  const averageProductivity = totalSessions ? weightedProductivity / totalSessions : null;
  const totalActivityCount = activityCategoryRows.reduce((sum, row) => sum + (numeric(row.activity_count) ?? 0), 0);
  const totalTravelMinutes = transportByMode.reduce((sum, row) => sum + row.minutes, 0);
  const totalTravelDistanceKm = transportByMode.reduce((sum, row) => sum + row.distanceKm, 0);
  const bestProductiveDay = bestRow(
    dailyRelationships.filter((row) => row.averageProductivity !== null),
    (row) => row.averageProductivity,
  );
  const leadingSubject = bestRow(studyBySubject, (row) => row.hours);
  const leadingApplication = bestRow(screenTimeByApp, (row) => row.minutes);
  const largestSpending = bestRow(spendingByCategory, (row) => row.amount);
  const mostUsedLocation = bestRow(activityByLocation, (row) => row.visitCount);
  const leadingActivityCategory = bestRow(activityByCategory, (row) => row.percentage);
  const correlationStudySleep = pearson(dailyRelationships, "sleepHours", "studyHours");
  const correlationProductivitySleep = pearson(dailyRelationships, "sleepHours", "averageProductivity");
  const totalMoodEntries = moodTrend.reduce((sum, row) => sum + row.entryCount, 0);
  const averageMood = totalMoodEntries
    ? moodTrend.reduce((sum, row) => sum + row.averageScore * row.entryCount, 0) / totalMoodEntries
    : null;

  return {
    range,
    summary: {
      totalSpending: round(totalSpending),
      studyHours: round(totalStudyHours),
      screenTimeMinutes: totalScreenMinutes,
      activityCount: totalActivityCount,
      activityHours: round(totalActivitySeconds / 3600),
      averageProductivity: round(averageProductivity),
      averageMood: round(averageMood),
      sleepHours: round(sleepTrend.reduce((sum, row) => sum + row.durationHours, 0)),
      travelMinutes: totalTravelMinutes,
      travelDistanceKm: round(totalTravelDistanceKm),
    },
    charts: {
      spendingByCategory,
      spendingByDay,
      studyBySubject,
      studyByDay,
      productivityBySubject,
      screenTimeByApp,
      screenTimeByCategory,
      moodTrend,
      sleepTrend,
      activityByCategory,
      activityByLocation,
      transportByMode,
      foodSpendingByMeal,
      productivityByDayOfWeek,
    },
    insights: [
      { key: "mostProductiveDay", label: "Most productive day", value: bestProductiveDay?.date ?? null, metric: round(bestProductiveDay?.averageProductivity), unit: "rating / 5" },
      { key: "mostStudiedSubject", label: "Most studied subject", value: leadingSubject?.subject ?? null, metric: leadingSubject?.hours ?? null, unit: "hours" },
      { key: "mostUsedApplication", label: "Most used application", value: leadingApplication?.applicationName ?? null, metric: leadingApplication?.minutes ?? null, unit: "minutes" },
      { key: "largestSpendingCategory", label: "Largest spending category", value: largestSpending?.category ?? null, metric: largestSpending?.amount ?? null, percentage: largestSpending?.percentage ?? null },
      { key: "mostUsedLocation", label: "Most used location", value: mostUsedLocation?.location ?? null, metric: mostUsedLocation?.visitCount ?? null, unit: "activities" },
      { key: "totalTravelTime", label: "Total travel time", value: totalTravelMinutes, unit: "minutes" },
      { key: "totalTravelDistance", label: "Total travel distance", value: round(totalTravelDistanceKm), unit: "km" },
      { key: "sleepStudyCorrelation", label: "Sleep duration and study hours", value: correlationStudySleep, unit: "Pearson r", sampleDays: dailyRelationships.filter((row) => row.sleepHours !== null && row.studyHours !== null).length },
      { key: "sleepProductivityCorrelation", label: "Sleep duration and productivity", value: correlationProductivitySleep, unit: "Pearson r", sampleDays: dailyRelationships.filter((row) => row.sleepHours !== null && row.averageProductivity !== null).length },
      { key: "activityTimeShare", label: "Largest activity-category time share", value: leadingActivityCategory?.category ?? null, percentage: leadingActivityCategory?.percentage ?? null },
    ],
  };
}

export async function getProgress(userId, query) {
  const today = await getDatabaseDate();
  const range = resolveProgressRange(query, today);
  const result = await getProgressQueries(userId, range.from, range.to);
  const goals = result.goals.map((goal) => {
    const targetValue = numeric(goal.target_value);
    const currentValue = numeric(goal.current_value);
    const rangeValue = numeric(goal.range_value);
    return {
      goalId: goal.goal_id,
      goalName: goal.goal_name,
      goalType: goal.goal_type,
      status: goal.status,
      targetValue,
      currentValue,
      currentProgressDate: goal.current_progress_date,
      rangeValue,
      rangeProgressDate: goal.range_progress_date,
      unit: goal.unit,
      progressPercent: targetValue > 0 && currentValue !== null
        ? round(Math.min((currentValue / targetValue) * 100, 100))
        : null,
    };
  });
  const studyHours = hoursFromSeconds(result.study.study_seconds);
  const activitySeconds = numeric(result.activity.activity_seconds) ?? 0;
  const exerciseSeconds = numeric(result.activity.exercise_seconds) ?? 0;
  const screenMinutes = numeric(result.screen.screen_minutes) ?? 0;

  return {
    range: { date: range.date, type: range.range, from: range.from, to: range.to },
    summary: {
      spending: round(result.spending),
      studyHours,
      activityCount: numeric(result.activity.activity_count) ?? 0,
      activityHours: round(activitySeconds / 3600),
      exerciseCount: numeric(result.activity.exercise_count) ?? 0,
      exerciseHours: round(exerciseSeconds / 3600),
      screenTimeMinutes: screenMinutes,
      averageProductivity: round(numeric(result.study.average_productivity)),
      studySessions: numeric(result.study.session_count) ?? 0,
      ratedStudySessions: numeric(result.study.rated_sessions) ?? 0,
    },
    goals,
    budgetGoals: result.budgets.map((goal) => {
      const target = numeric(goal.target_value);
      const spent = numeric(goal.spent_amount) ?? 0;
      return {
        goalId: goal.goal_id,
        goalName: goal.goal_name,
        targetAmount: target,
        spentAmount: round(spent),
        remainingAmount: target === null ? null : round(Math.max(target - spent, 0)),
        spentPercent: target > 0 ? round((spent / target) * 100) : null,
      };
    }),
    study: {
      totalHours: studyHours,
      byDay: result.studyByDay.map((row) => ({ date: row.date, hours: hoursFromSeconds(row.study_seconds) })),
    },
    activity: {
      activityCount: numeric(result.activity.activity_count) ?? 0,
      totalHours: round(activitySeconds / 3600),
      exerciseCount: numeric(result.activity.exercise_count) ?? 0,
      exerciseHours: round(exerciseSeconds / 3600),
      byCategory: result.activityCategories.map((row) => ({
        category: row.category,
        activityCount: numeric(row.activity_count) ?? 0,
        hours: hoursFromSeconds(row.activity_seconds),
      })),
    },
    screenTime: {
      totalMinutes: screenMinutes,
      byApplication: result.screenApplications.map((row) => ({ applicationName: row.application_name, minutes: numeric(row.minutes) ?? 0 })),
      byCategory: result.screenCategories.map((row) => ({ category: row.category, minutes: numeric(row.minutes) ?? 0 })),
    },
    productivity: {
      averageRating: round(numeric(result.study.average_productivity)),
      ratedSessions: numeric(result.study.rated_sessions) ?? 0,
    },
  };
}