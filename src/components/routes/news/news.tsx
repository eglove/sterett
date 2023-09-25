import type { JSX } from 'react';
import type { z } from 'zod';

import type {
  calendarEventSchema,
  getNewsAndEvents,
  newsUpdateSchema,
} from '../../../sanity/queries/get-news-and-events.ts';
import { Container } from '../../container.tsx';
import { Event } from './event.tsx';
import { NewsUpdate } from './news-update.tsx';

type NewsProperties = {
  readonly data: Awaited<ReturnType<typeof getNewsAndEvents>>;
};

export function News({ data }: NewsProperties): JSX.Element {
  const usedDates = new Set();

  if (data.length === 0) {
    return (
      <Container>
        <p>There&apos;s nothing here yet, check back later.</p>
      </Container>
    );
  }

  return (
    <Container className="p-0">
      <div className="grid w-full gap-4 p-2">
        {data.map(datum => {
          if ((datum as z.infer<typeof newsUpdateSchema>).date !== undefined) {
            return (
              <NewsUpdate
                data={datum as z.infer<typeof newsUpdateSchema>}
                key={datum._id}
              />
            );
          }

          return (
            <Event
              data={datum as z.output<typeof calendarEventSchema>}
              key={datum._id}
              usedDates={usedDates}
            />
          );
        })}
      </div>
    </Container>
  );
}
