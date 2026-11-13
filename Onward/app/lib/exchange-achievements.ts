export type ExchangeAchievementMetrics = {
  posts: number;
  comments: number;
  followers: number;
  longestStreak: number;
};

export const EXCHANGE_ACHIEVEMENT_CATEGORIES = [
  { id: "getting-started", title: "Getting Started" },
  { id: "exchange-activity", title: "Exchange Activity" },
  { id: "onward-streaks", title: "onWard Streaks" },
] as const;

export type ExchangeAchievementCategory =
  (typeof EXCHANGE_ACHIEVEMENT_CATEGORIES)[number]["id"];

export type ExchangeAchievement = {
  id: string;
  title: string;
  description: string;
  category: ExchangeAchievementCategory;
  icon: "post" | "comment" | "followers" | "streak";
  value: number;
  target: number;
  unit: string;
  earned: boolean;
  progressPercent: number;
};

const ACHIEVEMENTS = [
  {
    id: "first-post",
    title: "First post",
    description: "Share your first post in the Exchange.",
    category: "getting-started",
    icon: "post",
    metric: "posts",
    target: 1,
    unit: "posts",
  },
  {
    id: "regular-contributor",
    title: "Regular contributor",
    description: "Share 10 posts in the Exchange.",
    category: "exchange-activity",
    icon: "post",
    metric: "posts",
    target: 10,
    unit: "posts",
  },
  {
    id: "first-reply",
    title: "First reply",
    description: "Join a conversation with your first comment.",
    category: "getting-started",
    icon: "comment",
    metric: "comments",
    target: 1,
    unit: "comments",
  },
  {
    id: "conversation-builder",
    title: "Conversation builder",
    description: "Leave 10 comments in the Exchange.",
    category: "exchange-activity",
    icon: "comment",
    metric: "comments",
    target: 10,
    unit: "comments",
  },
  {
    id: "first-follower",
    title: "First follower",
    description: "Someone follows your Exchange profile.",
    category: "getting-started",
    icon: "followers",
    metric: "followers",
    target: 1,
    unit: "followers",
  },
  {
    id: "community-builder",
    title: "Community builder",
    description: "Reach 10 followers on your Exchange profile.",
    category: "exchange-activity",
    icon: "followers",
    metric: "followers",
    target: 10,
    unit: "followers",
  },
  {
    id: "week-of-progress",
    title: "Week of progress",
    description: "Reach a 7-day onWard activity streak.",
    category: "onward-streaks",
    icon: "streak",
    metric: "longestStreak",
    target: 7,
    unit: "days",
  },
] as const;

export function getExchangeAchievements(metrics: ExchangeAchievementMetrics): ExchangeAchievement[] {
  return ACHIEVEMENTS.map((achievement) => {
    const value = Math.max(0, metrics[achievement.metric]);
    return {
      ...achievement,
      icon: achievement.icon,
      value,
      earned: value >= achievement.target,
      progressPercent: Math.min(100, Math.round((value / achievement.target) * 100)),
    };
  });
}

export function getExchangeAchievementCategory(id: string) {
  return EXCHANGE_ACHIEVEMENT_CATEGORIES.find((category) => category.id === id) ?? null;
}

export function getExchangeAchievement(
  achievements: ExchangeAchievement[],
  id: string,
): ExchangeAchievement | null {
  return achievements.find((achievement) => achievement.id === id) ?? null;
}
