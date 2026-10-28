/**
 * EcoGenius Recommendation Engine
 * Recommends Electricity, Water, and Waste-Management challenges using
 * a multi-factor weighted scoring formula:
 * 
 * Score(C) = w_interest * S_interest + w_activity * S_activity + w_diff * S_diff + w_novelty * S_novelty
 */

// Normalized category mapping
export const SUSTAINABILITY_PILLARS = {
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  WASTE: 'Waste Management'
};

export const normalizeCategory = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('electr') || c.includes('energy') || c.includes('solar') || c.includes('power')) {
    return SUSTAINABILITY_PILLARS.ELECTRICITY;
  }
  if (c.includes('water') || c.includes('hydro') || c.includes('rain') || c.includes('leak')) {
    return SUSTAINABILITY_PILLARS.WATER;
  }
  if (c.includes('waste') || c.includes('plastic') || c.includes('clean') || c.includes('compost') || c.includes('recycle')) {
    return SUSTAINABILITY_PILLARS.WASTE;
  }
  return SUSTAINABILITY_PILLARS.WASTE; // fallback
};

// Default weights
export const DEFAULT_WEIGHTS = {
  interest: 0.35,  // 35%
  activity: 0.25,  // 25%
  difficulty: 0.20,// 20%
  novelty: 0.20    // 20%
};

/**
 * Calculate difficulty suitability (0.0 to 1.0)
 * Match challenge difficulty to user's level / points
 */
export const calculateDifficultyScore = (challengeDifficulty = 'Medium', userPoints = 0) => {
  const diff = (challengeDifficulty || 'Medium').toLowerCase();
  
  if (userPoints < 250) {
    // Beginner: Easy is best, Hard is intimidating
    if (diff === 'easy') return 1.0;
    if (diff === 'medium') return 0.65;
    return 0.35; // hard
  } else if (userPoints <= 650) {
    // Intermediate: Medium is ideal, Hard is attractive, Easy is okay
    if (diff === 'medium') return 1.0;
    if (diff === 'hard') return 0.85;
    return 0.60; // easy
  } else {
    // Advanced: Hard is best challenge, Medium is solid, Easy is low motivation
    if (diff === 'hard') return 1.0;
    if (diff === 'medium') return 0.75;
    return 0.40; // easy
  }
};

/**
 * Calculate past activity affinity score (0.0 to 1.0)
 */
export const calculateActivityScore = (challenge, joinedChallenges = [], submissions = []) => {
  const cat = normalizeCategory(challenge.category);
  const chId = challenge._id || challenge.id;

  // If currently active and in progress, penalize re-recommendation
  const isAlreadyJoined = joinedChallenges.some(jc => (jc.challengeId === chId || jc.id === chId) && jc.status !== 'Completed');
  if (isAlreadyJoined) {
    return 0.15; // low priority since user is already doing it
  }

  // Count past completions in this category
  const categorySubmissions = submissions.filter(s => {
    const sCat = normalizeCategory(s.category || s.challengeCategory || '');
    return sCat === cat;
  });

  const approvedInCat = categorySubmissions.filter(s => (s.status || '').toLowerCase() === 'approved').length;
  const totalInCat = categorySubmissions.length;

  if (totalInCat === 0) {
    // Neutral baseline for untouched category
    return 0.50;
  }

  const successRate = totalInCat > 0 ? (approvedInCat / totalInCat) : 0.5;
  // Affinity increases with approved completions in this pillar
  return Math.min(1.0, 0.5 + (successRate * 0.3) + Math.min(approvedInCat * 0.1, 0.2));
};

/**
 * Calculate novelty / diversity score (0.0 to 1.0)
 * High score if the user has neglected this pillar recently
 */
export const calculateNoveltyScore = (challenge, joinedChallenges = [], submissions = []) => {
  const targetCat = normalizeCategory(challenge.category);

  // Pillar counts
  const pillarCounts = {
    [SUSTAINABILITY_PILLARS.ELECTRICITY]: 0,
    [SUSTAINABILITY_PILLARS.WATER]: 0,
    [SUSTAINABILITY_PILLARS.WASTE]: 0
  };

  joinedChallenges.forEach(jc => {
    const c = normalizeCategory(jc.challengeData?.category || jc.category || '');
    if (pillarCounts[c] !== undefined) pillarCounts[c]++;
  });

  const totalJoined = joinedChallenges.length;
  if (totalJoined === 0) {
    return 0.85; // All pillars are novel for beginners!
  }

  const countInTarget = pillarCounts[targetCat] || 0;
  const targetRatio = countInTarget / totalJoined;

  // The less the user has explored this pillar, the higher the novelty bonus
  if (countInTarget === 0) return 1.0; // Completely fresh pillar!
  if (targetRatio < 0.2) return 0.85;  // Under-represented pillar
  if (targetRatio < 0.4) return 0.65;  // Balanced
  return 0.40; // Over-represented, encourage trying other pillars
};

/**
 * Calculate interest match score (0.0 to 1.0)
 */
export const calculateInterestScore = (challenge, userInterests = {}, department = '') => {
  const cat = normalizeCategory(challenge.category);

  // Explicit user interests (0.0 - 1.0 scale)
  let interestVal = userInterests[cat] !== undefined ? userInterests[cat] : 0.75;

  // Implicit boost by department relevance if not explicitly customized
  const deptLower = (department || '').toLowerCase();
  if (deptLower.includes('electr') || deptLower.includes('eee') || deptLower.includes('ece') || deptLower.includes('auto')) {
    if (cat === SUSTAINABILITY_PILLARS.ELECTRICITY) interestVal = Math.min(1.0, interestVal + 0.15);
  } else if (deptLower.includes('civil') || deptLower.includes('mech')) {
    if (cat === SUSTAINABILITY_PILLARS.WATER) interestVal = Math.min(1.0, interestVal + 0.15);
  } else if (deptLower.includes('env') || deptLower.includes('bio') || deptLower.includes('chem')) {
    if (cat === SUSTAINABILITY_PILLARS.WASTE) interestVal = Math.min(1.0, interestVal + 0.15);
  }

  return Math.min(1.0, Math.max(0.1, interestVal));
};

/**
 * Generate human-friendly rationale explanation
 */
export const generateRationale = (cat, subScores, challenge, userPoints) => {
  const reasons = [];

  if (subScores.interest >= 0.85) {
    reasons.push(`Strong interest match for ${cat}`);
  }

  if (subScores.novelty >= 0.85) {
    reasons.push(`Novelty boost: explore under-represented ${cat} pillar`);
  } else if (subScores.activity >= 0.75) {
    reasons.push(`Great past track record in ${cat}`);
  }

  const diff = (challenge.difficulty || 'Medium').toLowerCase();
  if (subScores.difficulty >= 0.85) {
    if (userPoints < 250 && diff === 'easy') {
      reasons.push('Perfect beginner-friendly onboarding challenge');
    } else if (userPoints >= 650 && diff === 'hard') {
      reasons.push('High-reward advanced challenge for your rank');
    } else {
      reasons.push(`Optimal ${challenge.difficulty} difficulty fit`);
    }
  }

  if (reasons.length === 0) {
    reasons.push(`Curated campus sustainability mission for ${cat}`);
  }

  return reasons.join(' • ');
};

/**
 * Main Recommendation Engine function
 */
export const getPersonalizedRecommendations = ({
  challenges = [],
  user = {},
  joinedChallenges = [],
  submissions = [],
  userInterests = {
    [SUSTAINABILITY_PILLARS.ELECTRICITY]: 0.8,
    [SUSTAINABILITY_PILLARS.WATER]: 0.8,
    [SUSTAINABILITY_PILLARS.WASTE]: 0.8
  },
  weights = DEFAULT_WEIGHTS,
  filterPillar = 'all', // 'all' | 'Electricity' | 'Water' | 'Waste Management'
  limit = 6
}) => {
  if (!Array.isArray(challenges) || challenges.length === 0) {
    return [];
  }

  const userPoints = user?.eco_points || 0;
  const userDept = user?.department || '';

  const scoredChallenges = challenges.map(challenge => {
    const cat = normalizeCategory(challenge.category);

    const sInterest = calculateInterestScore(challenge, userInterests, userDept);
    const sActivity = calculateActivityScore(challenge, joinedChallenges, submissions);
    const sDifficulty = calculateDifficultyScore(challenge.difficulty, userPoints);
    const sNovelty = calculateNoveltyScore(challenge, joinedChallenges, submissions);

    // Weighted composite score (0.0 to 1.0)
    const compositeScore = (
      (weights.interest * sInterest) +
      (weights.activity * sActivity) +
      (weights.difficulty * sDifficulty) +
      (weights.novelty * sNovelty)
    );

    const matchPercentage = Math.round(Math.min(99, Math.max(55, compositeScore * 100)));
    const subScores = {
      interest: sInterest,
      activity: sActivity,
      difficulty: sDifficulty,
      novelty: sNovelty
    };

    const rationale = generateRationale(cat, subScores, challenge, userPoints);

    // Pillar icons & badges
    const pillarMeta = {
      [SUSTAINABILITY_PILLARS.ELECTRICITY]: { icon: '⚡', color: '#F57F17', bg: '#FFF8E1' },
      [SUSTAINABILITY_PILLARS.WATER]: { icon: '💧', color: '#0288D1', bg: '#E1F5FE' },
      [SUSTAINABILITY_PILLARS.WASTE]: { icon: '♻️', color: '#2E7D32', bg: '#E8F5E9' }
    }[cat] || { icon: '🌱', color: '#2E7D32', bg: '#E8F5E9' };

    const isJoined = joinedChallenges.some(jc => jc.challengeId === (challenge._id || challenge.id));

    return {
      ...challenge,
      normalizedPillar: cat,
      matchPercentage,
      compositeScore,
      subScores,
      rationale,
      pillarMeta,
      isJoined
    };
  });

  // Filter by requested pillar if specified
  let filtered = scoredChallenges;
  if (filterPillar && filterPillar !== 'all') {
    filtered = scoredChallenges.filter(sc => sc.normalizedPillar === filterPillar);
  }

  // Sort descending by composite recommendation score
  filtered.sort((a, b) => b.compositeScore - a.compositeScore);

  return filtered.slice(0, limit);
};
