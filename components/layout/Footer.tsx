'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import CreateEventLink from '@/components/landing/CreateEventLink';

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
  const pathname = usePathname();
  const [openSection, setOpenSection] =
    useState<string | null>(null);

  if (pathname === '/') {
    return <LandingFooter />;
  }

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

function LandingFooter() {
  return (
    <footer className="bg-[#17151E] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-7 md:py-12">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-9 md:flex-row md:items-start md:justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-[#8C76C8]/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              width="38"
              height="38"
              className="h-[38px] w-[38px] object-contain"
            />
            <span className="text-base font-extrabold tracking-[-0.04em]">
              UntapGo
            </span>
          </Link>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/68"
          >
            <Link className="flex min-h-11 items-center transition hover:text-white focus-visible:text-white focus-visible:outline-none" href="/events">
              Explore events
            </Link>
            <CreateEventLink className="flex min-h-11 items-center transition hover:text-white focus-visible:text-white focus-visible:outline-none">
              Create event
            </CreateEventLink>
            <Link className="flex min-h-11 items-center transition hover:text-white focus-visible:text-white focus-visible:outline-none" href="/login">
              Sign in
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs leading-5 text-white/45 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl">
            UntapGo is an independent community product and is not affiliated
            with or endorsed by Wizards of the Coast.
          </p>
          <p className="shrink-0">© 2026 UntapGo</p>
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
