import { LinkIcon } from '@heroicons/react/24/solid';
import { Link } from '@nextui-org/react';
import type { JSX } from 'react';

import type { FileSchema } from '../../../sanity/queries/get-files.ts';

export function DocumentLink({
  document,
}: {
  readonly document: FileSchema;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-1 py-2">
      <Link
        className="text-black underline"
        href={document.file.asset.url}
        rel="noreferrer"
        target="_blank"
      >
        {document.title}
      </Link>{' '}
      <LinkIcon className="h-4 w-4" />
    </div>
  );
}
