import React from 'react';

interface CalendarProps {
  year: number;
  month: number; // 1-12
  checkedDates: string[]; // YYYY-MM-DD
}

export default function Calendar({ year, month, checkedDates }: CalendarProps) {
  const checkedSet = new Set(checkedDates);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const weekRows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weekRows.push(days.slice(i, i + 7));
  }

  const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDayLabels.map((label) => (
          <div key={label} className="text-center text-xs font-bold text-text-sub py-1">
            {label}
          </div>
        ))}
      </div>
      {weekRows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7 gap-1 mb-1">
          {row.map((day, di) => {
            if (day === null) return <div key={`e-${di}`} className="aspect-square" />;

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isChecked = checkedSet.has(dateStr);

            return (
              <div
                key={dateStr}
                className={`aspect-square flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                  isToday
                    ? 'bg-primary text-white shadow-md'
                    : isChecked
                    ? 'bg-green/20 text-green'
                    : 'text-text-sub'
                }`}
              >
                {isChecked ? '✅' : day}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
