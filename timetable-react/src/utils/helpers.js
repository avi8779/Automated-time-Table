export const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  return `${hr % 12 || 12}:${m} ${ampm}`;
};

export const DAY_ORDER = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
export const DAY_LABELS = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
