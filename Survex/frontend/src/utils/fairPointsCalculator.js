/**
 * Mathematical Fair Eco-Points Formula & Ranking Engine
 * Transparent, deterministic, and fair eco-points scoring.
 * 
 * Mathematical Formulation:
 * Points = round( BasePoints * DifficultyMultiplier * AIQualityMultiplier + OnTimeBonus + StreakBonus + GreenHubBonus )
 * 
 * 1. BasePoints (B): Challenge baseline value (40 - 100 pts)
 * 2. Difficulty Multiplier (M_diff):
 *    - Easy:   1.00
 *    - Medium: 1.25
 *    - Hard:   1.50
 * 3. AI Quality Multiplier (M_ai):
 *    M_ai = 0.70 + (0.30 * AI_Confidence)  where AI_Confidence in [0.65, 1.00]
 * 4. On-Time Bonus (B_ontime): +10 points
 * 5. Streak Bonus (B_streak): min(streakDays * 2, 20) points
 * 6. GreenHUB Inspiration Bonus (B_greenhub): +15 points awarded upon sharing verified proof
 */

export function calculateFairPoints({
  basePoints = 50,
  difficulty = 'Medium',
  aiConfidence = 0.92,
  onTime = true,
  streakDays = 0,
  sharedToGreenHub = true
} = {}) {
  const b = Number(basePoints) > 0 ? Number(basePoints) : 50;

  // 1. Difficulty Multiplier
  const diffStr = String(difficulty || 'Medium').toLowerCase();
  let mDiff = 1.25;
  if (diffStr.includes('hard')) {
    mDiff = 1.50;
  } else if (diffStr.includes('easy')) {
    mDiff = 1.00;
  }

  // 2. AI Quality Multiplier
  const rawConf = Number(aiConfidence);
  const conf = isNaN(rawConf) ? 0.90 : Math.max(0.60, Math.min(1.00, rawConf));
  const mAi = 0.70 + (0.30 * conf);

  // 3. Bonuses
  const bOnTime = onTime ? 10 : 0;
  const bStreak = Math.min(Math.max(0, Number(streakDays) || 0) * 2, 20);
  const bGreenHub = sharedToGreenHub ? 15 : 0;

  // 4. Mathematical calculation
  const weightedBase = b * mDiff * mAi;
  const totalPoints = Math.round(weightedBase + bOnTime + bStreak + bGreenHub);

  return {
    totalPoints,
    basePoints: b,
    difficulty: difficulty || 'Medium',
    difficultyMultiplier: mDiff,
    aiConfidence: Number(conf.toFixed(3)),
    aiConfidencePct: Math.round(conf * 100),
    aiQualityMultiplier: Number(mAi.toFixed(3)),
    weightedBase: Number(weightedBase.toFixed(1)),
    onTimeBonus: bOnTime,
    streakBonus: bStreak,
    greenHubBonus: bGreenHub,
    formulaBreakdown: `${b} × ${mDiff} (diff) × ${mAi.toFixed(2)} (AI quality) + ${bOnTime} (on-time) + ${bStreak} (streak) + ${bGreenHub} (GreenHUB) = ${totalPoints} pts`
  };
}

export function rankLeaderboardFairly(students = [], submissions = []) {
  // Aggregate stats per student
  const studentStats = {};
  submissions.forEach(s => {
    const sid = s.student_id || s.studentId;
    if (!sid) return;
    if (!studentStats[sid]) {
      studentStats[sid] = { verifiedCount: 0, confSum: 0 };
    }
    const status = s.status || '';
    if (status === 'Approved' || status === 'Completed' || status === 'AI_PASSED') {
      studentStats[sid].verifiedCount += 1;
      const conf = s.verification_result?.confidence_score || s.verification?.confidence || 0.92;
      studentStats[sid].confSum += Number(conf);
    }
  });

  // Filter out pure admin roles from student competition
  const validStudents = (students || []).filter(s => s.role !== 'admin');

  const ranked = validStudents.map(student => {
    const sid = student._id || student.id;
    const stats = studentStats[sid] || {
      verifiedCount: student.challenges_completed || 0,
      confSum: (student.challenges_completed || 0) * 0.92
    };

    const verifiedCount = Math.max(stats.verifiedCount, student.challenges_completed || 0);
    const avgConf = verifiedCount > 0 ? (stats.confSum / verifiedCount) : 0.90;
    const streak = student.streak || student.streak_days || 3;
    const ecoPoints = Number(student.eco_points) || 0;

    return {
      ...student,
      _id: sid,
      id: sid,
      eco_points: ecoPoints,
      challenges_completed: verifiedCount,
      ai_quality_index: Math.round(avgConf * 100),
      streak,
      badges: student.badges || ['🌱 Eco Starter']
    };
  });

  // Sort strictly by fair mathematical criteria
  ranked.sort((a, b) => {
    if (b.eco_points !== a.eco_points) return b.eco_points - a.eco_points;
    if (b.challenges_completed !== a.challenges_completed) return b.challenges_completed - a.challenges_completed;
    if (b.ai_quality_index !== a.ai_quality_index) return b.ai_quality_index - a.ai_quality_index;
    return b.streak - a.streak;
  });

  return ranked.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}
