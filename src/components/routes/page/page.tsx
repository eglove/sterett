import type { TypedObject } from '@portabletext/types';
import type { JSX } from 'react';
import type { ZodIntersection } from 'zod';

import type {
  imageAssetSchema,
  typedObjectSchema,
} from '../../../sanity/queries/schema.ts';
import { Container } from '../../container.tsx';
import { SanityContent } from '../../sanity-content.tsx';

type SlugProperties = {
  readonly content: ZodIntersection<
    typeof typedObjectSchema,
    typeof imageAssetSchema
  >;
};

export function Page({ content }: SlugProperties): JSX.Element {
  if (content === undefined) {
    return (
      <Container>
        <p>There&apos;s nothing here yet, check back later.</p>
      </Container>
    );
  }

  return (
    <Container>
      <SanityContent value={content as unknown as TypedObject} />
    </Container>
  );
}
