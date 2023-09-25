import type { JSX, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type ContainerProperties = {
  readonly children: ReactNode;
  readonly className?: string;
};

export function Container({
  children,
  className,
}: ContainerProperties): JSX.Element {
  return (
    <div
      className={twMerge(
        'my-4 grid place-items-center gap-4 rounded-lg bg-gray-50 p-4 shadow-sm shadow-sky-50',
        className,
      )}
    >
      {children}
    </div>
  );
}
