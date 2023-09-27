import { Image } from '@nextui-org/image';
import type { JSX } from 'react';

import type { getGalleryImages } from '../../../sanity/queries/get-gallery-images.ts';
import { Container } from '../../container.tsx';

type GalleryProperties = {
  readonly images: Awaited<ReturnType<typeof getGalleryImages>>;
};

export function Gallery({ images }: GalleryProperties): JSX.Element {
  return (
    <Container>
      <div className="flex flex-wrap gap-4">
        {images.map(image => {
          return (
            <Image
              alt={image.description}
              className="relative h-auto max-w-full rounded-lg"
              height={Number(image.image.asset.metadata.dimensions.height)}
              key={image.image.asset.url}
              src={image.image.asset.url}
              width={Number(image.image.asset.metadata.dimensions.width)}
            />
          );
        })}
      </div>
    </Container>
  );
}
