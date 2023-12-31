import { z } from 'zod';

import { NO_DRAFTS, sterettSanityClient } from '../sterett-sanity-client.ts';
import { imageAssetSchema, typedObjectSchema } from './schema.ts';

export const getPageSchema = z.object({
  _id: z.string(),
  content: z.intersection(typedObjectSchema, imageAssetSchema),
  title: z.string(),
});

export async function getPage(
  slug: string,
): Promise<z.output<typeof getPageSchema> | undefined> {
  const pageQuery = `*[_type == "page" && slug.current == $slug && ${NO_DRAFTS}]{
    _id, 
    title, 
    content[] {
      ...,
      asset-> {
        url,
        metadata {
          dimensions {
            height,
            width,
          }
        }
      }
    }
  }`;

  const pages = await sterettSanityClient.fetch<
    z.infer<typeof getPageSchema>[]
  >(pageQuery, {
    slug,
  });

  return pages[0];
}
