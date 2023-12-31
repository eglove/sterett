import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuToggle,
} from '@nextui-org/navbar';
import { Link } from '@nextui-org/react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

const navUrls = [
  {
    name: 'Home',
    url: '/',
  },
  {
    name: 'News',
    url: '/news',
  },
  {
    name: 'Calendar',
    url: '/calendar',
  },
  {
    name: 'Files',
    url: '/files',
  },
  {
    name: 'Trustees',
    url: '/trustees',
  },
];

type NavigationProperties = {
  readonly imagesAmount: number;
  readonly pathName: string;
};

export function Navigation({
  imagesAmount,
  pathName,
}: NavigationProperties): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathName]);

  return (
    <Navbar
      className="mt-4 rounded-lg bg-white shadow-md shadow-sky-50"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={(isOpen): void => {
        return setIsMenuOpen(isOpen ?? false);
      }}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden"
        />
        <NavbarBrand>
          <h1 className="m-2 border-b-2 border-sky-700 font-bold text-sky-700 sm:text-2xl">
            Sterett Creek Village Trustee
          </h1>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent className="hidden gap-4 md:flex md:flex-wrap">
        {navUrls.map(item => {
          return (
            <NavbarItem
              className="text-sky-700"
              isActive={pathName === item.url}
              key={item.name}
            >
              <Link href={item.url}>{item.name}</Link>
            </NavbarItem>
          );
        })}
        {imagesAmount > 0 && (
          <NavbarItem
            className="text-sky-700"
            isActive={pathName === '/gallery'}
            key="gallery"
          >
            <Link href="/gallery">Pictures</Link>
          </NavbarItem>
        )}
      </NavbarContent>
      <NavbarMenu className="mt-4 rounded-lg">
        {navUrls.map(item => {
          return (
            <NavbarItem
              className="text-sky-700"
              isActive={pathName === item.url}
              key={item.name}
            >
              <Link href={item.url}>{item.name}</Link>
            </NavbarItem>
          );
        })}
        {imagesAmount > 0 && (
          <NavbarItem
            className="text-sky-700"
            isActive={pathName === '/gallery'}
            key="gallery"
          >
            <Link href="/gallery">Pictures</Link>
          </NavbarItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
