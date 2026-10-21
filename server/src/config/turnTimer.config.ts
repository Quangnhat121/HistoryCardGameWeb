export const TURN_TIMER_CONFIG = {
  short: { maxTimelineCards: 7, durationMs: 15_000 },
  medium: { maxTimelineCards: 16, durationMs: 25_000 },
  long: { durationMs: 35_000 },
  challengeExtensionMs: 3_000,
} as const;

export const getTurnDurationMs = (timelineCardCount: number): number => {
  if (timelineCardCount <= TURN_TIMER_CONFIG.short.maxTimelineCards)
    return TURN_TIMER_CONFIG.short.durationMs;
  if (timelineCardCount <= TURN_TIMER_CONFIG.medium.maxTimelineCards)
    return TURN_TIMER_CONFIG.medium.durationMs;
  return TURN_TIMER_CONFIG.long.durationMs;
};
