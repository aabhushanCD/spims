/** Time-of-day greeting for the dashboard header. */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good evening";
  }

  return "Good night";
}

/** First name for the greeting, with a safe fallback. */
export function getFirstName(name: string | null | undefined): string {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0];
}
