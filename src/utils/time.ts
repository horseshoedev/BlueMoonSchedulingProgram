export const formatTime = (time24: string, timeFormat: '12' | '24' = '24'): string => {
  if (timeFormat === '12') {
    const [hour, minute] = time24.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  }
  return time24;
};

export const formatTimeSlot = (slot: string, timeFormat: '12' | '24' = '24'): string => {
  const [start, end] = slot.split('-');
  const formattedStart = formatTime(start, timeFormat);
  const formattedEnd = formatTime(end, timeFormat);
  return `${formattedStart} - ${formattedEnd}`;
}; 