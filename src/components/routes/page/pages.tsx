import { Link } from '@nextui-org/link';
import type { JSX } from 'react';

import type { getAllPages } from '../../../sanity/queries/get-all-pages.ts';
import { Container } from '../../container';

type PageProperties = {
  readonly pages: Awaited<ReturnType<typeof getAllPages>>;
};

export function Pages({ pages }: PageProperties): JSX.Element {
  return (
    <Container>
      {pages.map(page => {
        return (
          <div className="w-full" key={page._id}>
            <Link
              className="underline"
              href={`/page/${page.slug.current}`}
              key={page._id}
            >
              {page.title}
            </Link>
          </div>
        );
      })}
    </Container>
  );
}
