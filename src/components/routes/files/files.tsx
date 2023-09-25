import type { JSX } from 'react';

import type { getFiles } from '../../../sanity/queries/get-files.ts';
import { Container } from '../../container.tsx';
import { DocumentLink } from './document-link.tsx';

type FilesProperties = {
  readonly files: Awaited<ReturnType<typeof getFiles>>;
};

export function Files({ files }: FilesProperties): JSX.Element {
  return (
    <Container>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div>
            <h2 className="text-2xl font-bold">Files</h2>
            {files.covenants.map(covenant => {
              return <DocumentLink document={covenant} key={covenant._id} />;
            })}
            {files.general.map(file => {
              return <DocumentLink document={file} key={file._id} />;
            })}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Meeting Minutes</h2>
          {files.meetingMinutes.map(meetingMinute => {
            return (
              <DocumentLink document={meetingMinute} key={meetingMinute._id} />
            );
          })}
        </div>
      </div>
    </Container>
  );
}
