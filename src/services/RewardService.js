/**
 * RewardService — pure functions for daily login rewards and streak logic.
 *
 * @see {import('../types').DailyRewardResult}
 */

import { STREAK_REWARDS, DEFAULT_DAILY_REWARD } from "../config/GameConfig";

/**
 * Calculate the daily reward based on login streak.
 * @param {number} streak - current streak count (already updated)
 * @returns {{ pokeball: number, greatball: number, ultraball: number }}
 */
export function calculateDailyReward(streak) {
  for (const tier of STREAK_REWARDS) {
    if (streak % tier.divisor === 0) return { ...tier.reward };
  }
  return { ...DEFAULT_DAILY_REWARD };
}

/**
 * Full daily reward computation.
 * @param {{ lastLoginDate: string|null, loginStreak: number }} profile
 * @returns {import('../types').DailyRewardResult | null} null if already claimed today
 */
export function processDailyReward(profile) {
  const today = new Date().toDateString();
  if (profile.lastLoginDate === today) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = profile.lastLoginDate === yesterday.toDateString();
  const newStreak = wasYesterday ? profile.loginStreak + 1 : 1;
  const reward = calculateDailyReward(newStreak);

  return { reward, streak: newStreak };
}
