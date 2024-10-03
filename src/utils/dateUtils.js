export const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

export const getDateOfISOWeek = (w, y) => {
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
};

export const formatDate = (date) => {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const sortShifts = (shiftsToSort) => {
  return shiftsToSort.sort((a, b) => {
    if (a.isTextShift && b.isTextShift) {
      return a.shift.localeCompare(b.shift);
    } else if (a.isTextShift) {
      return 1;
    } else if (b.isTextShift) {
      return -1;
    } else {
      const [aStart, aEnd] = a.shift.split('-').map(Number);
      const [bStart, bEnd] = b.shift.split('-').map(Number);
      if (aStart !== bStart) {
        return aStart - bStart;
      } else {
        return aEnd - bEnd;
      }
    }
  });
};

export const getSafe = (fn, defaultVal) => {
  try {
    return fn();
  } catch (e) {
    return defaultVal;
  }
};