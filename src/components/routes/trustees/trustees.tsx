import { Link } from '@nextui-org/link';
import { User } from '@nextui-org/user';
import lodash from 'lodash';
import type { JSX } from 'react';

import type { getTrustees } from '../../../sanity/queries/get-trustees.ts';
import { Container } from '../../container.tsx';

type AvatarColor = 'warning' | 'secondary' | 'danger' | 'primary' | 'success';
const colorValues: AvatarColor[] = lodash.shuffle([
  'warning',
  'secondary',
  'danger',
  'primary',
  'success',
]);

type TrusteesProperties = {
  readonly trustees: Awaited<ReturnType<typeof getTrustees>>;
};

export function Trustees({ trustees }: TrusteesProperties): JSX.Element {
  return (
    <Container>
      <div className="grid gap-4 md:grid-cols-3">
        {trustees.map((trustee, index) => {
          return (
            <div
              className="mb-4 w-full gap-4 border-b-2 pb-4"
              key={trustee._id}
            >
              <User
                className="gap-4"
                name={trustee.name}
                avatarProps={{
                  className: 'w-32 h-32',
                  color: colorValues[index] ?? 'default',
                  isBordered: true,
                  size: 'lg',
                  src: trustee.image.asset.url,
                }}
                description={
                  <>
                    <p>
                      <Link
                        className="text-black underline"
                        href={`tel:${trustee.phoneNumber}`}
                      >
                        {trustee.phoneNumber}
                      </Link>
                    </p>
                    <p className="text-small text-foreground-800">
                      {trustee.duties}
                    </p>
                  </>
                }
              />
            </div>
          );
        })}
      </div>
    </Container>
  );
}
