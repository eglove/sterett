import type { TypedObject } from '@portabletext/types';
import type { JSX } from 'react';

import { Container } from '../container.tsx';
import { SanityContent } from '../sanity-content.tsx';

type IndexProperties = {
  readonly content?: TypedObject;
};

export function Index({ content }: IndexProperties): JSX.Element {
  if (content === undefined) {
    return (
      <Container>
        <p>There&apos;s nothing here yet, check back later.</p>
      </Container>
    );
  }

  return (
    <Container>
      <SanityContent value={content} />
    </Container>
  );
}
