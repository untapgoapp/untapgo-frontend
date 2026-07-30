import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service | UntapGo",
  description: "The terms for accounts, events, decks, attendance and community participation on UntapGo.",
  alternates: { canonical: "https://untapgo.com/terms" },
};

const toc = [
  ["agreement","Agreement"],["eligibility","Eligibility"],["accounts","Accounts"],["service","The service"],
  ["offline","Offline events and safety"],["hosts","Host responsibilities"],["players","Player responsibilities"],
  ["content","User content"],["ip","Intellectual property"],["use","Acceptable use"],["moderation","Moderation"],
  ["privacy","Blocking and privacy"],["third-parties","Third-party services"],["availability","Availability"],
  ["pricing","Pricing"],["disclaimers","Disclaimers"],["liability","Liability"],["termination","Termination"],
  ["law","Governing law"],["changes","Changes"],["contact","Contact"],
].map(([id,label])=>({id,label}));

export default function TermsPage() {
  return <LegalPageShell title="Terms of Service" introduction="These Terms set the ground rules for using UntapGo to find players, organise events, share decks and manage attendance." toc={toc}>
    <LegalSection id="agreement" title="1. Agreement and acceptance">
      <p>UntapGo is provided by <strong>{"{{LEGAL_ENTITY_NAME}}"}</strong> (“UntapGo”, “we”, “us”). These Terms govern the UntapGo website, PWA and related services. They form an agreement between you and the operator.</p>
      <p>You accept these Terms when you create an account or otherwise use an account-based feature after the Terms are presented to you. If you do not agree, do not create or use an account. The <a href="/privacy">Privacy Policy</a> explains how personal data is handled; acknowledging that policy is not consent to every form of processing.</p>
    </LegalSection>
    <LegalSection id="eligibility" title="2. Eligibility">
      <p>You must be at least <strong>{"{{MINIMUM_USER_AGE}}"}</strong> and have legal capacity to enter this agreement. If the law where you live requires parent or guardian involvement, you must meet that requirement. The minimum age and any minor-specific process must be finalised before these Terms are published.</p>
      <p>Using UntapGo does not by itself mean that a person is old enough to attend every event or venue. Hosts, players and guardians remain responsible for age restrictions, supervision and local rules for an offline meeting.</p>
    </LegalSection>
    <LegalSection id="accounts" title="3. Accounts">
      <p>Provide an email address you control and accurate profile information. Use one personal account unless UntapGo has agreed to another arrangement. Do not impersonate anyone, share credentials, sell an account or let another person use your account to evade a restriction.</p>
      <p>You are responsible for reasonable account security and activity carried out through your credentials. Tell <strong>{"{{LEGAL_CONTACT_EMAIL}}"}</strong> promptly if you suspect unauthorised access. UntapGo currently supports email-and-password authentication through Supabase. Although third-party authentication may be added later, the inspected frontend does not currently implement Google sign-in.</p>
      <p>You may request permanent account deletion from Account settings. Deletion signs you out after the backend accepts the request. Some information may need to remain for safety, legal obligations, dispute handling or backups, as described in the Privacy Policy; the exact backend deletion effects require confirmation.</p>
    </LegalSection>
    <LegalSection id="service" title="4. What UntapGo does">
      <p>UntapGo helps players browse local Magic: The Gathering events, create listings, request and manage seats, save events, share selected deck information, receive in-app or optional push notifications, and manage attendance through host controls or QR check-in. Profiles can include a nickname, avatar, biography, Arena tag, play statistics and public decks.</p>
      <p>Most events are created by users. Unless an event clearly says that UntapGo itself is the organiser, the event host—not UntapGo—organises that meeting. UntapGo provides coordination software and cannot inspect or supervise every host, player, venue, deck, statement or offline interaction.</p>
    </LegalSection>
    <LegalSection id="offline" title="5. Offline events and personal safety">
      <p className="legal-note"><strong>UntapGo leads to real-world meetings.</strong> Decide carefully whether, where and with whom to meet. Online profiles, attendance history and a listed venue do not guarantee anyone’s identity, reliability or safety.</p>
      <p>Prefer suitable public venues, tell someone where you are going when appropriate, arrange your own safe transport and avoid disclosing unnecessary private information. Review the listing, venue, timing and participants. Leave or seek help if a situation feels unsafe. Account blocking is a product control, not a substitute for personal safety planning.</p>
      <p>Minors must follow applicable supervision requirements and venue rules. UntapGo does not provide emergency services. Contact local emergency services if anyone faces immediate danger, and notify venue staff where appropriate. A report to UntapGo is not monitored as an emergency channel.</p>
      <p>Nothing in these Terms excludes responsibility that cannot lawfully be excluded. However, users arrange and attend user-created events at their own discretion, and UntapGo cannot guarantee the conduct of people or condition of venues outside its control.</p>
    </LegalSection>
    <LegalSection id="hosts" title="6. Host responsibilities">
      <p>If you create or manage an event, you must:</p>
      <ul>
        <li>give accurate and timely information about the date, start time, duration, location, capacity, format, power level, proxy rules and important venue expectations;</li>
        <li>have permission to use the venue, follow its rules, ensure the planned activity is lawful, and avoid presenting a private address more widely than necessary;</li>
        <li>manage requests and capacity fairly, communicate material changes or cancellation promptly, and not create fake or misleading events;</li>
        <li>set reasonable table expectations, foster respectful conduct and take proportionate action when a participant creates a safety or venue problem;</li>
        <li>use attendance controls honestly, protect live QR codes, correct mistakes where possible and not mark absent people as present;</li>
        <li>use participant, profile and attendance information only to organise the event, handle legitimate safety issues or meet a legal obligation—not for unrelated marketing, harassment or surveillance.</li>
      </ul>
      <p>Hosts are responsible for the event they organise, including any permission, insurance, licence, accessibility, safeguarding or supervision required by their circumstances. UntapGo’s capacity and attendance tools do not transfer those duties to UntapGo.</p>
    </LegalSection>
    <LegalSection id="players" title="7. Player responsibilities">
      <p>Request a seat only when you genuinely intend to attend. Respond to changes and cancel promptly if your plans change. Follow lawful host and venue rules, arrive with a suitable deck and conduct yourself respectfully.</p>
      <p>Do not scan or share a QR code to create a false check-in, attend under another player’s identity, manipulate attendance status, submit dishonest event feedback, or abuse reporting tools. If a host’s instructions are unsafe or unlawful, do not follow them; leave, seek appropriate help and report the concern through the relevant channel.</p>
    </LegalSection>
    <LegalSection id="content" title="8. User content">
      <p>“User content” means material you submit, including profile text, avatars, event titles and descriptions, location details, host notes, deck names and lists, reports and feedback. You retain ownership of your user content. You must have the rights and permissions needed to submit it and must not expose another person’s private information without a valid reason and authority.</p>
      <p>You grant UntapGo a limited, worldwide, non-exclusive, royalty-free licence to host, store, technically reproduce, format, display and transmit your content only as needed to operate, secure and moderate the service. This includes displaying an event to potential players and making shared deck information visible at the table. The licence ends when the content is deleted from active systems, except for reasonable backup transition, legal obligations, safety evidence and copies legitimately shared with others.</p>
      <p>UntapGo may remove or restrict content under these Terms and the Community Guidelines. It does not acquire ownership of your profile, deck list or event description merely because you upload it.</p>
    </LegalSection>
    <LegalSection id="ip" title="9. Intellectual property">
      <p>UntapGo’s original software, product design, text, branding and logo belong to the operator or its licensors and are protected by applicable law. These Terms give you permission to use the service for its intended personal and community purposes; they do not transfer intellectual property rights.</p>
      <p>Magic: The Gathering, card names, symbols, artwork and related marks belong to their respective owners. Card information and artwork may be provided through Scryfall and remain subject to third-party rights and terms. UntapGo does not claim ownership of them.</p>
      <p><strong>UntapGo is an independent community product and is not affiliated with or endorsed by Wizards of the Coast.</strong></p>
    </LegalSection>
    <LegalSection id="use" title="10. Acceptable use">
      <p>Follow the <a href="/community-guidelines">Community Guidelines</a>. You must not use UntapGo to:</p>
      <ul>
        <li>break the law; threaten, harass or discriminate; facilitate violence; sexually harass anyone; or publish illegal content;</li>
        <li>commit fraud, run scams, impersonate someone, spam users, create deceptive events or give misleading locations;</li>
        <li>upload malware, probe or bypass access controls, disrupt the service, evade a restriction, or scrape in a way that harms the service or compromises personal data;</li>
        <li>manipulate requests, capacity, QR check-in, attendance, feedback or reports;</li>
        <li>discover, expose or exploit private information, including information hidden by privacy settings or a block;</li>
        <li>infringe intellectual property or use the service for unauthorised commercial promotion, resale or data brokerage.</li>
      </ul>
      <p>Reasonable personal use, ordinary linking and use of the product’s own export features are not prohibited by the restriction on harmful scraping.</p>
    </LegalSection>
    <LegalSection id="moderation" title="11. Reports and moderation">
      <p>Users can report profiles and submit event-related feedback. UntapGo may review relevant content, account history, event and attendance records, reports and technical evidence. Depending on context, severity, risk and prior conduct, action may include guidance, a warning, content or event removal, feature limits, cancellation of participation, temporary suspension or account termination.</p>
      <p>Immediate restrictions may be applied where reasonably necessary for safety, security, legal compliance or preservation of evidence. Not every disagreement or poor experience violates the rules, and UntapGo cannot promise a particular review time or outcome.</p>
      <p>Where reasonably possible and lawful, users should receive an understandable reason for a material restriction. The current product does not establish a formal appeal workflow. A person who believes an enforcement decision is mistaken may contact <strong>{"{{LEGAL_CONTACT_EMAIL}}"}</strong>; this contact route must be operationally verified.</p>
    </LegalSection>
    <LegalSection id="privacy" title="12. Blocking and privacy controls">
      <p>Profile controls determine whether a biography, Arena username, statistics and public decks appear. Nickname and avatar remain visible identifiers. A deck can be private, name-only or fully visible for an event. You are responsible for choosing settings suitable for what you share.</p>
      <p>Blocking limits product interactions and profile visibility, but cannot erase information already seen or copied, control conduct outside UntapGo, or guarantee two users never see the same public event or attend the same venue. Do not rely on blocking alone where there is a real-world safety risk.</p>
    </LegalSection>
    <LegalSection id="third-parties" title="13. Third-party services">
      <p>UntapGo relies on Supabase for authentication and storage, Mapbox for place search and maps, Firebase Cloud Messaging for optional push, and Scryfall for card information and artwork. Event pages can open a Google Maps search. These services may apply their own terms and privacy policies to their part of the interaction.</p>
      <p>UntapGo is not responsible for an external site’s independent content or availability. A link does not mean that UntapGo endorses every statement, product or venue shown there.</p>
    </LegalSection>
    <LegalSection id="availability" title="14. Availability and changes to the service">
      <p>UntapGo may need maintenance, security updates and feature changes. Events, notifications, maps or third-party data may sometimes be delayed or unavailable. We do not promise uninterrupted or error-free access.</p>
      <p>Features may be improved, replaced or retired for technical, safety, legal or product reasons. UntapGo will avoid changes that unfairly remove a consumer’s existing contractual benefit and will give reasonable notice where a material change requires it. The repository does not establish a formal beta designation, so these Terms do not label the service as beta.</p>
    </LegalSection>
    <LegalSection id="pricing" title="15. Pricing">
      <p>The inspected frontend contains no checkout, subscription, price or paid plan. This draft therefore does not impose payment, renewal, cancellation or refund terms. Before publication, the operator must confirm whether the current service is free as <strong>{"{{CURRENT_PRICING_STATUS}}"}</strong>.</p>
      <p>If paid features are introduced, the price, billing period, key functionality, cancellation terms and applicable refund rights will be shown before purchase. A future paid product may require separate terms and cannot be created merely by this paragraph.</p>
    </LegalSection>
    <LegalSection id="disclaimers" title="16. Reasonable disclaimers">
      <p>User-created listings, profiles, attendance and feedback may be inaccurate, incomplete or outdated. UntapGo does not verify every person, venue or event. Offline meetings carry ordinary risks of meeting people, travel, property loss and venue conditions. Card rulings, artwork, prices or deck data from third parties can also change or contain errors.</p>
      <p>UntapGo will provide the service with the care required by applicable law, but cannot guarantee that every feature will always work or that third-party data will be complete. Nothing here excludes statutory guarantees or remedies that cannot lawfully be excluded for consumers.</p>
    </LegalSection>
    <LegalSection id="liability" title="17. Liability">
      <p>Each party is responsible for loss it causes where applicable law provides. UntapGo is not responsible for loss caused solely by a user’s unlawful conduct, inaccurate listing, failure to follow reasonable safety steps, or a third-party service outside UntapGo’s reasonable control. This does not reduce responsibility where UntapGo had a legal duty and failed to meet it.</p>
      <p>Nothing in these Terms limits or excludes liability for fraud, wilful misconduct, death or personal injury caused by negligence where exclusion is prohibited, gross negligence where it cannot be limited, or any mandatory consumer right. No arbitrary financial cap is included. The final liability language should be reviewed against the operator’s business structure and applicable Estonian and consumer law.</p>
    </LegalSection>
    <LegalSection id="termination" title="18. Suspension and termination">
      <p>UntapGo may restrict a feature or account for a serious or repeated breach, a credible safety threat, fraud, security compromise, legal requirement or material risk to the service. The measure should be proportionate to the issue. Urgent action may be immediate; otherwise reasonable notice or an opportunity to correct conduct may be appropriate.</p>
      <p>You can stop using UntapGo and request account deletion. On termination, your right to use the account ends. Terms that by nature need to continue—such as ownership, handling of existing legal claims, lawful moderation records and applicable liability provisions—remain effective. Content and personal data are then handled under the Privacy Policy and actual deletion process.</p>
    </LegalSection>
    <LegalSection id="law" title="19. Governing law and consumer rights">
      <p>These Terms are governed by <strong>{"{{GOVERNING_LAW}}"}</strong>, subject to mandatory consumer protections that apply where you habitually reside. The proposed competent courts are <strong>{"{{COMPETENT_COURTS}}"}</strong>, but consumers may bring a claim in any court available to them under mandatory applicable law.</p>
      <p>These Terms do not require private arbitration and do not waive a consumer’s right to use a competent court or statutory dispute process. Any official alternative dispute-resolution body or platform should be added only after the operator confirms it applies.</p>
    </LegalSection>
    <LegalSection id="changes" title="20. Changes to these Terms">
      <p>UntapGo may update these Terms for service, safety, legal or operational changes. Material changes will be explained and communicated by an appropriate in-service notice, email or other reasonable method in advance where required. Changes will not retroactively remove accrued mandatory rights. Continuing to use the account after new Terms take effect signifies acceptance only to the extent permitted by law.</p>
    </LegalSection>
    <LegalSection id="contact" title="21. Contact">
      <p>Operator: <strong>{"{{LEGAL_ENTITY_NAME}}"}</strong><br />Address: <strong>{"{{LEGAL_ENTITY_ADDRESS}}"}</strong><br />Legal contact: <strong>{"{{LEGAL_CONTACT_EMAIL}}"}</strong></p>
    </LegalSection>
  </LegalPageShell>;
}
