import type { PortableTextReactComponents } from '@portabletext/react';
import { PortableText } from '@portabletext/react';
import type { TypedObject } from '@portabletext/types';
import type { JSX } from 'react';
import type { z } from 'zod';

import type { imageAssetSchema } from '../sanity/queries/schema.ts';
import { SanityPortableImage } from './sanity-image.tsx';

type SanityContentProperties = {
  readonly value: TypedObject;
};

const potableTextComponents: Partial<PortableTextReactComponents> = {
  types: {
    image(properties: {
      value?: { altText?: string; asset: z.infer<typeof imageAssetSchema> };
    }): JSX.Element | null {
      if (properties.value?.asset !== undefined) {
        return (
          <SanityPortableImage
            altText={properties.value.altText ?? ''}
            image={properties.value.asset}
          />
        );
      }

      return null;
    },
  },
};

export function SanityContent({ value }: SanityContentProperties): JSX.Element {
  return (
    <div className="prose">
      <PortableText components={potableTextComponents} value={value} />
    </div>
  );
}
