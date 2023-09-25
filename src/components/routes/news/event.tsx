import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import type { TypedObject } from '@portabletext/types';
import lodash from 'lodash';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { Fragment } from 'react';
import type { z } from 'zod';

import type { calendarEventSchema } from '../../../sanity/queries/get-news-and-events.ts';
import { getRelativeDate, now } from '../../../util/util.ts';
import { SanityContent } from '../../sanity-content.tsx';

type EventProperties = {
  readonly data: z.output<typeof calendarEventSchema>;
  readonly usedDates: Set<unknown>;
};

const eventDateFormat = (date: string): string => {
  return DateTime.fromISO(date, { zone: 'America/Chicago' }).toLocaleString({
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export function Event({ data, usedDates }: EventProperties): ReactNode {
  const isInRange =
    now.getTime() > new Date(data.startsAt).getTime() &&
    now.getTime() < new Date(data.endsAt).getTime();
  const relativeDate = getRelativeDate(data.startsAt);
  let isDateShowing = false;

  if (!usedDates.has(relativeDate) && !isInRange) {
    isDateShowing = true;
    usedDates.add(relativeDate);
  }

  if (!usedDates.has('Happening Now!') && isInRange) {
    isDateShowing = true;
    usedDates.add('Happening Now!');
  }

  return (
    <Fragment key={data._id}>
      {isDateShowing && (
        <Card className="text-lg font-bold">
          <CardBody>
            {isInRange ? 'Happening Now!' : getRelativeDate(data.startsAt)}
          </CardBody>
        </Card>
      )}
      <Card className="h-max w-full bg-sky-200" id={data._id}>
        <CardHeader className="block">
          <strong className="flex flex-wrap gap-2">
            <CalendarDaysIcon height={24} width={24} />
            <span>{eventDateFormat(data.startsAt)}</span>
            <span>
              {data.endsAt === data.startsAt
                ? ''
                : ` - ${eventDateFormat(data.endsAt)}`}
            </span>
          </strong>
          <br />
          <div className="font-semibold">{data.title}</div>
        </CardHeader>
        {!lodash.isNil(data.description) && (
          <>
            <Divider />
            <CardBody>
              <SanityContent value={data.description as TypedObject} />
            </CardBody>
          </>
        )}
      </Card>
    </Fragment>
  );
}
