import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import type { TypedObject } from '@portabletext/types';
import lodash from 'lodash';
import type { ReactNode } from 'react';
import type { z } from 'zod';

import type { newsUpdateSchema } from '../../../sanity/queries/get-news-and-events.ts';
import { SanityContent } from '../../sanity-content.tsx';

type NewsUpdateProperties = {
  readonly data: z.infer<typeof newsUpdateSchema>;
};

export function NewsUpdate({ data }: NewsUpdateProperties): ReactNode {
  return (
    <Card className="h-max w-full" id={data._id}>
      <CardHeader className="block">
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
  );
}
