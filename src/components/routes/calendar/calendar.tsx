import { DateTime } from 'luxon';
import type { JSX } from 'react';

import type { getCalendarEvents } from '../../../sanity/queries/get-calendar-events';
import { CalendarView } from './calendar-view.tsx';

type CalendarProperties = {
  readonly calendarEvents: Awaited<ReturnType<typeof getCalendarEvents>>;
};

export function Calendar({ calendarEvents }: CalendarProperties): JSX.Element {
  const events = calendarEvents.map(item => {
    return {
      description: item.description,
      end: DateTime.fromISO(item.endsAt, {
        zone: 'America/Chicago',
      }).toJSDate(),
      start: DateTime.fromISO(item.startsAt, {
        zone: 'America/Chicago',
      }).toJSDate(),
      title: item.title,
    };
  });

  return (
    <div className="my-4 rounded-lg bg-gray-50 py-4 shadow-sm shadow-sky-50 md:p-4">
      <CalendarView events={[...events]} />
    </div>
  );
}
