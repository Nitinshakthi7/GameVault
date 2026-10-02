export const STATUSES = [
  { value: 'owned', label: 'Owned' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'replay', label: 'Replay' },
  { value: 'mastered', label: 'Mastered' },
];

export const STATUS_LABELS = {
  ...Object.fromEntries(STATUSES.map((s) => [s.value, s.label])),
  wishlist: 'Wishlist',
};

export const OWNERSHIP_TYPES = [
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Physical' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'free', label: 'Free' },
  { value: 'borrowed', label: 'Borrowed' },
  { value: 'other', label: 'Other' },
];

export const SORTS = [
  { value: 'recentlyAdded', label: 'Recently added' },
  { value: 'title', label: 'Title' },
  { value: 'releaseDate', label: 'Release date' },
  { value: 'rating', label: 'External rating' },
  { value: 'personalRating', label: 'My rating' },
  { value: 'playtime', label: 'Playtime' },
  { value: 'recentlyPlayed', label: 'Recently played' },
];

export const COMPLETION_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'not_started', label: 'Not started' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
