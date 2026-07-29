'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import {
  FaDiscord,
  FaFacebookF,
  FaXTwitter,
} from 'react-icons/fa6';

type FooterItem = {
  label: string;
  href?: string;
};

const footerSections: Array<{
  title: string;
  items: FooterItem[];
}> = [
  {
    title: 'About',
    items: [
      { label: 'About UntapGo', href: '/about' },
      { label: 'How UntapGo Works', href: '/how-untapgo-works' },
      { label: 'Community Guidelines', href: '/community-guidelines' },
      { label: 'Safety', href: '/safety' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Play',
    items: [
      { label: 'Explore Events', href: '/events' },
      { label: 'Host a Game', href: '/create' },
      { label: 'Commander', href: '/events?format=commander' },
      { label: 'Modern', href: '/events?format=modern' },
      { label: 'All Formats', href: '/formats' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Sign Up', href: '/signup' },
      { label: 'My Events', href: '/events/me' },
      { label: 'Profile', href: '/profile' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Manage Cookies', href: '/cookies' },
    ],
  },
];

export default function Footer() {
  const [openSection, setOpenSection] =
    useState<string | null>(null);

  return (
    <footer className="w-full bg-[#17151E] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">

        <div className="hidden gap-10 text-sm md:grid md:grid-cols-4">
          {footerSections.map((section) => (
            <FooterLinks
              key={section.title}
              section={section}
            />
          ))}
        </div>

        <div className="divide-y divide-white/10 md:hidden">
          {footerSections.map((section) => {
            const open =
              openSection === section.title;

            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection(
                      open ? null : section.title
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    py-4
                    text-left
                    text-sm
                    font-semibold
                    text-white/90
                  "
                >
                  {section.title}

                  <ChevronDown
                    className={`
                      h-4
                      w-4
                      text-white/40
                      transition-transform
                      duration-200
                      ${
                        open
                          ? 'rotate-180'
                          : ''
                      }
                    `}
                  />
                </button>

                <div
                  className={`
                    grid
                    overflow-hidden
                    transition-[grid-template-rows,opacity]
                    duration-300
                    ${
                      open
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }
                  `}
                >
                  <div className="min-h-0">
                    <FooterList
                      items={section.items}
                      className="pb-4"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-3">

          <SocialIcon href="https://discord.gg/untapgo">
            <FaDiscord size={15} />
          </SocialIcon>

          <SocialIcon href="https://facebook.com/untapgoapp">
            <FaFacebookF size={14} />
          </SocialIcon>

          <SocialIcon href="https://x.com/untapgoapp">
            <FaXTwitter size={14} />
          </SocialIcon>

        </div>

        <div
          className="
            mt-8
            flex
            flex-col
            items-center
            justify-between
            gap-4
            border-t
            border-white/10
            pt-6
            text-xs
            text-white/50
            md:flex-row
          "
        >
          <div className="flex gap-4">
            <span>English</span>
            <span>Worldwide</span>
          </div>

          <div className="text-center md:text-right">
            © 2026 UntapGo · Find your next table.
          </div>
        </div>

      </div>
    </footer>
  );
}

function FooterLinks({
  section,
}: {
  section: {
    title: string;
    items: FooterItem[];
  };
}) {
  return (
    <div>
      <h4 className="mb-4 font-semibold text-white/90">
        {section.title}
      </h4>

      <FooterList items={section.items} />
    </div>
  );
}

function FooterList({
  items,
  className = '',
}: {
  items: FooterItem[];
  className?: string;
}) {
  return (
    <ul
      className={`space-y-2 text-sm text-white/60 ${className}`}
    >
      {items.map((item) => (
        <li key={item.label}>
          {item.href ? (
            <Link
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SocialIcon({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        bg-white/10
        transition
        hover:bg-white/20
      "
    >
      {children}
    </a>
  );
}
