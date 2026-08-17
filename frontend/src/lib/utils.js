export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b);
}

export function formatMessageDate(date) {
  const messageDate = startOfDay(date);
  const today = startOfDay(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = startOfDay(yesterdayDate);
  if (messageDate === today) return "Today";
  if (messageDate === yesterday) return "Yesterday";

  const messageYear = new Date(date).getFullYear();
  const currentYear = new Date().getFullYear();

  return new Date(date).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(messageYear !== currentYear ? { year: "numeric" } : {}),
  });
};