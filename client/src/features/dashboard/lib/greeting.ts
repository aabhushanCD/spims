/** Time-of-day greeting bucket for the dashboard header. */
export function getGreetingKey(
  hour: number,
): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

/** English greeting, retained for non-React callers and tests. */
export function getGreeting(hour: number): string {
  const key = getGreetingKey(hour);

  switch (key) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    default:
      return "Good night";
  }
}

/** First name for the greeting, with a safe fallback. */
export function getFirstName(name: string | null | undefined): string {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0];
}
