import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Layers3,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

import CreateEventLink from "@/components/landing/CreateEventLink";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "UntapGo · Find local Magic events",
  description:
    "Discover nearby Magic: The Gathering events, meet local players, choose your deck and organise your next table with UntapGo.",
  alternates: {
    canonical: "https://untapgo.com",
  },
  openGraph: {
    title: "UntapGo · Find local Magic events",
    description:
      "Discover nearby Magic: The Gathering events, meet local players, choose your deck and organise your next table with UntapGo.",
    url: "https://untapgo.com",
    siteName: "UntapGo",
    images: [
      {
        url: "/logo.png",
        width: 500,
        height: 500,
        alt: "UntapGo",
      },
    ],
    type: "website",
  },
};

const benefits = [
  {
    icon: MapPin,
    title: "Find nearby games",
    copy: "Browse local events by location, format, date and available seats.",
  },
  {
    icon: UserCheck,
    title: "Know what you’re joining",
    copy: "See the host, players, decks, power level and table details before requesting a seat.",
  },
  {
    icon: QrCode,
    title: "Run the table smoothly",
    copy: "Manage requests, attendance and QR check-in without juggling messages and spreadsheets.",
  },
];

const steps = [
  {
    title: "Find or create a table",
    copy: "Browse nearby games or host one yourself.",
  },
  {
    title: "Choose your deck",
    copy: "Share as much or as little deck information as you prefer.",
  },
  {
    title: "Turn up and play",
    copy: "Check in, meet the table and keep local play organised.",
  },
];

function ArrowLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={secondary ? styles.secondaryCta : styles.primaryCta}
    >
      {children}
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

function CreateLink({
  children,
  secondary = false,
}: {
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <CreateEventLink
      className={secondary ? styles.secondaryCta : styles.primaryCta}
    >
      {children}
      <ChevronRight aria-hidden="true" />
    </CreateEventLink>
  );
}

function PlayerAvatar({
  initials,
  tone,
}: {
  initials: string;
  tone: string;
}) {
  return (
    <span className={styles.avatar} style={{ background: tone }}>
      {initials}
    </span>
  );
}

function ProductPreview() {
  return (
    <div
      className={styles.productStage}
      role="img"
      aria-label="UntapGo event detail with nearby events, table players, deck selection and QR attendance"
    >
      <div className={styles.mapFragment} aria-hidden="true">
        <svg viewBox="0 0 330 220" preserveAspectRatio="none">
          <path d="M-20 56 C58 30 86 95 162 72 S256 28 360 56" />
          <path d="M32 -10 C70 54 72 124 46 238" />
          <path d="M182 -20 C167 65 204 122 286 239" />
          <path d="M-10 164 C79 137 168 177 350 128" />
        </svg>
        <span className={`${styles.mapPin} ${styles.mapPinOne}`}>
          <MapPin />
        </span>
        <span className={`${styles.mapPin} ${styles.mapPinTwo}`}>
          <MapPin />
        </span>
        <span className={styles.mapLabel}>Nearby events</span>
      </div>

      <div className={styles.phone}>
        <div className={styles.phoneTop}>
          <span>9:41</span>
          <span className={styles.phoneNotch} />
          <span>● ●</span>
        </div>
        <div className={styles.appBar}>
          <span className={styles.backCircle}>‹</span>
          <span>Event</span>
          <span className={styles.moreCircle}>•••</span>
        </div>
        <div className={styles.eventHero}>
          <span className={styles.status}>Open · 1 seat left</span>
          <h2>Thursday Commander</h2>
          <p>Hosted by Mara</p>
        </div>
        <div className={styles.eventFacts}>
          <div>
            <CalendarDays />
            <span>
              <strong>Thu, 19:00</strong>
              <small>This week</small>
            </span>
          </div>
          <div>
            <MapPin />
            <span>
              <strong>Telliskivi</strong>
              <small>1.8 km away</small>
            </span>
          </div>
        </div>
        <div className={styles.tableBlock}>
          <div className={styles.blockHeading}>
            <span>At the table</span>
            <small>3 of 4</small>
          </div>
          <div className={styles.players}>
            <div>
              <PlayerAvatar initials="M" tone="#DED5F4" />
              <span>
                <strong>Mara</strong>
                <small>Host</small>
              </span>
            </div>
            <div>
              <PlayerAvatar initials="KL" tone="#E7E0D6" />
              <span>
                <strong>Karl</strong>
                <small>Mid-power</small>
              </span>
            </div>
            <div>
              <PlayerAvatar initials="A" tone="#D9E7E0" />
              <span>
                <strong>Anna</strong>
                <small>Casual</small>
              </span>
            </div>
          </div>
        </div>
        <div className={styles.deckChoice}>
          <span className={styles.deckArt}>
            <Layers3 />
          </span>
          <span>
            <small>Your deck</small>
            <strong>Choose a deck</strong>
          </span>
          <ChevronRight />
        </div>
        <div className={styles.requestButton}>Request a seat</div>
      </div>

      <div className={styles.qrFragment}>
        <span className={styles.qrIcon}>
          <QrCode />
        </span>
        <span>
          <small>Attendance</small>
          <strong>QR check-in ready</strong>
        </span>
        <Check />
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div
      className={styles.communityPreview}
      role="img"
      aria-label="UntapGo event roster with confirmed players and deck privacy settings"
    >
      <div className={styles.previewTopline}>
        <span>
          <Users />
          At the table
        </span>
        <span>3 / 4 players</span>
      </div>
      <div className={styles.roster}>
        <div>
          <PlayerAvatar initials="M" tone="#DED5F4" />
          <span>
            <strong>Mara</strong>
            <small>Host · Checked in</small>
          </span>
          <ShieldCheck />
        </div>
        <div>
          <PlayerAvatar initials="KL" tone="#E7E0D6" />
          <span>
            <strong>Karl</strong>
            <small>Seat confirmed · Deck shared</small>
          </span>
          <span className={styles.deckMini}><Layers3 /></span>
        </div>
        <div>
          <PlayerAvatar initials="A" tone="#D9E7E0" />
          <span>
            <strong>Anna</strong>
            <small>Seat confirmed · Deck private</small>
          </span>
          <span className={styles.privateMark}>Private</span>
        </div>
      </div>
      <div className={styles.savedNote}>
        <Sparkles />
        <span>
          <strong>Saved for Thursday</strong>
          <small>You’ll get an update if anything changes.</small>
        </span>
      </div>
    </div>
  );
}

function HostPreview() {
  return (
    <div
      className={styles.hostPreview}
      role="img"
      aria-label="UntapGo host controls with pending requests, attendance summary and QR check-in"
    >
      <div className={styles.hostTitle}>
        <span>
          <small>Thursday Commander</small>
          <strong>Host controls</strong>
        </span>
        <span className={styles.liveDot}>Live</span>
      </div>
      <div className={styles.hostTabs}>
        <span className={styles.activeTab}>Requests <b>2</b></span>
        <span>Players</span>
        <span>Attendance</span>
      </div>
      <div className={styles.requestRow}>
        <PlayerAvatar initials="JV" tone="#E6DFF4" />
        <span>
          <strong>Joonas</strong>
          <small>Requested 8 min ago</small>
        </span>
        <span className={styles.approveButton}>
          <Check />
        </span>
      </div>
      <div className={styles.hostSummary}>
        <span>
          <small>Confirmed</small>
          <strong>3 / 4</strong>
        </span>
        <span>
          <small>Checked in</small>
          <strong>2</strong>
        </span>
        <span>
          <small>Pending</small>
          <strong>2</strong>
        </span>
      </div>
      <div className={styles.qrAction}>
        <QrCode />
        <span>
          <strong>Show live QR</strong>
          <small>Fast check-in at the table</small>
        </span>
        <ChevronRight />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              Local Magic, without the group-chat chaos
            </p>
            <h1 id="hero-title">Find a table. Bring a deck. Play.</h1>
            <p className={styles.heroBody}>
              Discover local Magic events, meet nearby players and organise
              your next game without digging through group chats.
            </p>
            <div className={styles.heroActions}>
              <ArrowLink href="/events">Explore events</ArrowLink>
              <CreateLink secondary>Create an event</CreateLink>
            </div>
            <p className={styles.supportLine}>Free to join · Built for local play</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className={styles.benefits} aria-labelledby="benefits-title">
        <div className={styles.sectionInner}>
          <p className={styles.sectionKicker}>Made for game night</p>
          <h2 id="benefits-title">Less searching. More playing.</h2>
          <div className={styles.benefitGrid}>
            {benefits.map(({ icon: Icon, title, copy }) => (
              <article key={title}>
                <span className={styles.benefitIcon}><Icon /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>How it works</p>
            <h2 id="how-title">From “any games?” to game on.</h2>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.community} aria-labelledby="community-title">
        <div className={`${styles.sectionInner} ${styles.splitSection}`}>
          <div className={styles.splitCopy}>
            <p className={styles.sectionKicker}>The local scene</p>
            <h2 id="community-title">
              Your local play community, finally in one place.
            </h2>
            <p>
              UntapGo gives players and hosts a shared home for discovering
              games, organising tables and building a reliable local scene.
            </p>
            <ul className={styles.detailList}>
              <li><Check /> Event requests and saved events</li>
              <li><Check /> Player profiles and privacy controls</li>
              <li><Check /> Attendance verification and notifications</li>
            </ul>
          </div>
          <CommunityPreview />
        </div>
      </section>

      <section className={styles.host} aria-labelledby="host-title">
        <div className={`${styles.sectionInner} ${styles.splitSection}`}>
          <div className={styles.splitCopy}>
            <p className={styles.sectionKicker}>For hosts</p>
            <h2 id="host-title">Hosting should not feel like admin.</h2>
            <p>
              Create the event, approve players, share the details and handle
              check-in from one compact control centre.
            </p>
            <CreateLink>Host a game</CreateLink>
          </div>
          <HostPreview />
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-title">
        <div className={styles.finalInner}>
          <Clock3 aria-hidden="true" />
          <h2 id="final-title">Your next table may already be nearby.</h2>
          <div className={styles.heroActions}>
            <ArrowLink href="/events">Explore events</ArrowLink>
            <CreateLink secondary>Create an event</CreateLink>
          </div>
        </div>
      </section>
    </div>
  );
}
