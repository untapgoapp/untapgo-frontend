import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | UntapGo",
  description: "How UntapGo processes personal data when you use its website, PWA, events, profiles and notifications.",
  alternates: { canonical: "https://untapgo.com/privacy" },
};

const toc = [
  ["scope", "Scope"], ["controller", "Who controls your data"], ["data", "Information we process"],
  ["visibility", "Who can see information"], ["purposes", "Purposes and legal bases"],
  ["location", "Location data"], ["storage", "Cookies and local storage"], ["sharing", "Sharing and providers"],
  ["transfers", "International transfers"], ["retention", "Retention and deletion"], ["security", "Security"],
  ["rights", "Your rights"], ["decisions", "Automated decisions"], ["children", "Children"],
  ["changes", "Changes"], ["contact", "Contact"],
].map(([id, label]) => ({ id, label }));

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" introduction="This policy explains what information UntapGo processes, why it is used, who may see it, and the choices and rights available to you." toc={toc}>
      <LegalSection id="scope" title="1. Scope">
        <p>This policy applies when you use the UntapGo website, install or use it as a progressive web application (PWA), create or attend an event, manage a profile or deck, use notifications, or contact the service. UntapGo helps local Magic: The Gathering players find one another and organise in-person tabletop events.</p>
        <p>The policy covers information handled through the frontend and the UntapGo application programming interface. A third-party site or service linked from UntapGo applies its own privacy terms.</p>
      </LegalSection>

      <LegalSection id="controller" title="2. Who controls your data">
        <p>The controller is <strong>{"{{LEGAL_ENTITY_NAME}}"}</strong>, operating the product under the name UntapGo. Its registered address is <strong>{"{{LEGAL_ENTITY_ADDRESS}}"}</strong> and company registration number is <strong>{"{{COMPANY_REGISTRATION_NUMBER}}"}</strong>.</p>
        <p>Privacy questions and rights requests may be sent to <strong>{"{{PRIVACY_CONTACT_EMAIL}}"}</strong>. The current implementation does not establish that UntapGo has appointed a Data Protection Officer, so none is named here.</p>
      </LegalSection>

      <LegalSection id="data" title="3. Information we process">
        <h3>Account and authentication</h3>
        <p>When you register with email and password, Supabase Authentication processes your email address, password authentication material, account identifier, confirmation status and session information. UntapGo does not need to read your plain-text password.</p>
        <p>If you choose “Continue with Google”, Google authenticates you and Supabase receives the standard identity information made available for the <code>openid</code>, <code>email</code> and <code>profile</code> scopes. This can include a Google account identifier, email address, email-verification state, name and profile image. UntapGo does not receive your Google password and does not request access to Google Drive, Gmail, Calendar or contacts. Google processes the sign-in interaction under its own privacy terms.</p>
        <h3>Profile information</h3>
        <p>You can submit a nickname, avatar, biography, MTG Arena username and an optional city, state or region, and country. The service generates counts of events hosted and played. Privacy settings let you control whether your biography, Arena username, statistics, public decks and saved profile location appear publicly, only to mutual connections, or only to you where the interface offers that choice. Nickname and avatar remain visible so players can identify each other.</p>
        <h3>Events, participation and attendance</h3>
        <p>Event data can include title, description, date and duration, capacity, format, power level, proxy policy, host notes, venue address or label, Mapbox place identifier and coordinates. The service records hosting, seat requests, request decisions, membership, saved events, deck selections and the visibility chosen for those selections.</p>
        <p>For attendance, UntapGo can process expected, checked-in, attended, no-show, excused or disputed status; timestamps; verification method; and the person who verified attendance. QR check-in uses a short-lived event token. Hosts may enable walk-ins and finalise a roster. Feedback about a host or player may include a sentiment and reason such as inaccurate details, poor communication or unsafe behaviour.</p>
        <h3>Location-related information</h3>
        <p>You may search for a place through Mapbox or ask your browser for device geolocation. The browser returns latitude and longitude only after permission. Temporary search coordinates, a label and search radius can be saved in your browser for nearby event discovery. If you add a profile location, UntapGo stores the city, state or region, country and privacy choice. When Mapbox or device geolocation supplies coordinates, the backend deliberately rounds them before storage and uses them only for nearby sorting. Those coordinates are not returned in public profile responses. Events contain their submitted location and coordinates so they can be listed, mapped and opened in an external map.</p>
        <h3>Deck and card information</h3>
        <p>Deck records can contain names, format, imported or exported deck text, card entries, commander choice, public status, event-specific visibility and a cover image or Scryfall identifier. Scryfall card data and artwork URLs are used to support search and deck display.</p>
        <h3>Safety, preferences and communications</h3>
        <p>UntapGo processes favourite and blocked-user relationships, profile reports with a reason and optional details, event feedback, profile visibility choices, distance-unit preference, notification settings and saved events. Reports may contain information submitted about another person and are available to authorised moderation personnel.</p>
        <h3>Notification, device and technical data</h3>
        <p>If you enable browser push notifications, the service processes a locally generated device identifier, Firebase Cloud Messaging token, web platform label, application version and browser permission state. Supabase session tokens are stored in browser storage for authenticated API requests. Like most online services, hosting and backend systems may generate request, error, security and server logs containing timestamps, IP addresses, request details and device or browser information. The exact backend log fields and retention must be confirmed before publication.</p>
      </LegalSection>

      <LegalSection id="visibility" title="4. Public and private information">
        <p>Event listings, including the event’s submitted address or location label, may be available to visitors and logged-in users. A listing identifies its host by nickname and can show format, time, capacity and other event details. Publishing an event can therefore reveal a planned real-world activity. Do not use a private home address unless you are comfortable sharing it with the relevant audience.</p>
        <p>Nicknames and avatars are public identifiers. Biography, Arena username, statistics, public decks and profile location depend on profile settings and deck-level choices. A profile location can be public, visible only to mutual connections, or private. The separate nearby-discovery setting can allow approximate server-side distance sorting without making the city visible on the public profile. At an event, hosts and participants may see one another’s nickname, avatar, role, participation or attendance status and the deck information deliberately shared for that event. Hosts see seat requests and attendance-management information required to run their event.</p>
        <p>Blocked users have interactions restricted by the service, and the backend applies privacy filtering to public profile responses. Blocking cannot guarantee that two people will never see the same public listing, attend the same public venue or encounter information already shared offline. Reports and moderation records are not public, but may be seen by authorised administrators and disclosed where law or safety requires.</p>
      </LegalSection>

      <LegalSection id="purposes" title="5. Purposes and legal bases">
        <div className="legal-table-wrap"><table><thead><tr><th>Purpose</th><th>Information</th><th>GDPR basis</th></tr></thead><tbody>
          <tr><td>Accounts, authentication and account deletion</td><td>Email, identifiers, authentication and session data</td><td>Performance of the user agreement</td></tr>
          <tr><td>Profiles, decks, events, requests, saved events and attendance</td><td>Profile, deck, event, participation and QR records</td><td>Performance of the user agreement</td></tr>
          <tr><td>Location search and nearby results</td><td>Selected or device-provided coordinates, city, state or region, country, labels and radius</td><td>Consent for browser geolocation; performance of the agreement for a location you enter or select</td></tr>
          <tr><td>Optional browser push</td><td>Permission, device ID, FCM token and preference</td><td>Consent, which you may withdraw by disabling push</td></tr>
          <tr><td>Safety, blocking, reports and moderation</td><td>Relationships, reports, feedback and relevant account/event records</td><td>Legitimate interests in keeping the community safe, enforcing rules and preventing misuse; legal claims where necessary</td></tr>
          <tr><td>Security and abuse prevention</td><td>Authentication, request and security log data</td><td>Legitimate interests in securing accounts and systems; legal obligation where applicable</td></tr>
          <tr><td>Support and service operation</td><td>Contact content and related account or technical information</td><td>Performance of the agreement and legitimate interests in resolving problems</td></tr>
          <tr><td>Compliance and legal claims</td><td>Information relevant to a lawful request, dispute or obligation</td><td>Legal obligation or establishment, exercise or defence of legal claims</td></tr>
        </tbody></table></div>
        <p>The frontend contains no analytics, behavioural advertising or marketing-email integration. UntapGo therefore does not state a legal basis for those activities here.</p>
      </LegalSection>

      <LegalSection id="location" title="6. Location data">
        <p>You can choose an area by searching Mapbox. Search text and the resulting place data are sent directly from your browser to Mapbox. You can also press a current-location control. Only then does the browser request geolocation permission. Temporary event-discovery coordinates may be stored locally. Profile location uses city-level place data. If coordinates are saved for profile discovery, the backend rounds them before storage, never returns them in public profile responses, and uses them only to group or sort nearby results.</p>
        <p>You may enter a profile city, state or region, and country manually, use Mapbox search, or ask the browser to identify the current city. You can remove the saved profile location, choose who can see it, and separately disable its use for nearby results. Creating an event requires a location label and place identifier and can include coordinates. Event pages display the submitted address and offer a Google Maps search link. Location choices can reveal homes, workplaces, routines or travel. Hosts should choose suitable public venues where possible and provide no more detail than participants need.</p>
      </LegalSection>

      <LegalSection id="storage" title="7. Cookies and similar technologies">
        <p>UntapGo uses Supabase-managed first-party cookies for authentication, plus browser localStorage for an API access-token copy, selected location and radius, a push device identifier and push-enabled state. A Firebase service worker supports optional push delivery. These are described in the <a href="/cookies">Cookie Policy</a>.</p>
        <p>No non-essential analytics or marketing storage was found in the current implementation, so UntapGo does not display a consent banner. Device geolocation and push notifications each use the browser’s separate permission prompt.</p>
      </LegalSection>

      <LegalSection id="sharing" title="8. Sharing and service providers">
        <p>Information is shared only as needed to operate the features you use, enforce the rules, comply with law, handle a transaction involving the service, or protect people and systems. The current frontend verifies these providers:</p>
        <ul>
          <li><strong>Supabase</strong> — account authentication, session handling and avatar object storage; project configuration also identifies Supabase as an application service.</li>
          <li><strong>Mapbox</strong> — maps, place search, geocoding and map tiles. Mapbox receives browser network and search/location data when its features load.</li>
          <li><strong>Google Firebase Cloud Messaging</strong> — optional web push tokens and delivery. Google Maps receives a search query if you choose the external directions link.</li>
          <li><strong>Scryfall</strong> — Magic card information and artwork used for deck search and presentation. Scryfall may receive ordinary network data when hosted images load.</li>
          <li><strong>{"{{FRONTEND_HOSTING_PROVIDER}}"}</strong> and <strong>{"{{BACKEND_HOSTING_PROVIDER}}"}</strong> — hosting and delivery require factual confirmation before publication.</li>
        </ul>
        <p>The frontend does not show a mechanism for selling personal data or sharing it for behavioural advertising. Providers can have their own role and privacy terms for data they receive directly, such as Mapbox search or an external Google Maps visit.</p>
      </LegalSection>

      <LegalSection id="transfers" title="9. International transfers">
        <p>Some providers are international businesses and may process information outside Estonia or the European Economic Area. The configured project regions, processor locations and transfer safeguards are not established by this repository. Before publication, the operator must document them in <strong>{"{{INTERNATIONAL_TRANSFER_INFORMATION}}"}</strong>. We do not claim use of a particular safeguard until that review is complete.</p>
      </LegalSection>

      <LegalSection id="retention" title="10. Retention and account deletion">
        <p>UntapGo keeps information while an account is active and as needed to provide the relevant feature. No reliable fixed backend retention periods are present in this frontend. Retention must instead be limited by purpose, account status, safety needs, legal obligations and the time needed to resolve disputes.</p>
        <ul>
          <li>Account, profile, deck, saved-event and preference data are generally needed while the account exists.</li>
          <li>Event, request and attendance records may remain after an event to preserve event administration, safety records and user-facing history.</li>
          <li>Blocks remain until removed or the related data is deleted. Reports and moderation evidence may need to outlast other profile data to prevent repeated abuse or handle claims.</li>
          <li>Push tokens remain useful only while notifications are enabled for that device; the interface asks the backend to delete a device token when push is disabled.</li>
          <li>Support messages and security logs should be retained only while needed for support, security, compliance or claims. Exact criteria require backend review.</li>
        </ul>
        <p>The account settings send a permanent deletion request to the backend and then sign the user out. The frontend does not prove which database rows, public content, authentication records, logs or backups are deleted, anonymised or retained, or how quickly. These effects must be confirmed as <strong>{"{{ACCOUNT_DELETION_BEHAVIOUR}}"}</strong>. Limited information may be retained where required for legal obligations, fraud prevention, safety or legal claims, and residual copies may persist temporarily in backups, but the operator must verify that this reflects actual practice.</p>
      </LegalSection>

      <LegalSection id="security" title="11. Security">
        <p>UntapGo uses authenticated API requests, managed authentication, backend-enforced profile visibility and short-lived rotating QR check-in tokens. Access to moderation and service systems should be limited to people who need it. No online system is completely secure, and UntapGo cannot promise that unauthorised access or loss will never occur. If you believe your account is compromised, sign out where possible and contact <strong>{"{{PRIVACY_CONTACT_EMAIL}}"}</strong>.</p>
      </LegalSection>

      <LegalSection id="rights" title="12. Your data-protection rights">
        <p>Subject to the GDPR and applicable limits, you may ask for access to your personal data, correction, deletion, restriction, or a portable copy. You may object to processing based on legitimate interests. Where processing relies on consent, you may withdraw it without affecting earlier lawful processing. Push consent can be withdrawn in notification settings and browser settings; device-location permission can be withdrawn in browser or operating-system settings.</p>
        <p>Send a request to <strong>{"{{PRIVACY_CONTACT_EMAIL}}"}</strong>. UntapGo may need to verify identity and clarify the request. You may complain to the Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon) or another competent supervisory authority, particularly in the EEA country where you live or work or where the issue occurred.</p>
      </LegalSection>

      <LegalSection id="decisions" title="13. Automated decision-making">
        <p>The inspected frontend contains no legally significant automated decision-making or profiling. Attendance statuses, feedback and moderation tools do not establish an active automated “Trust Score”. If this changes, this policy must be updated before the feature is used in a way that significantly affects people.</p>
      </LegalSection>

      <LegalSection id="children" title="14. Children">
        <p>UntapGo is not intended for anyone below <strong>{"{{MINIMUM_USER_AGE}}"}</strong>. The operator has not yet provided the minimum age or a parental-consent process. Do not create an account below the stated age once it is set. Offline events involving minors must also follow applicable law, venue rules and appropriate adult supervision.</p>
      </LegalSection>

      <LegalSection id="changes" title="15. Changes to this policy">
        <p>This policy may change when the service, providers or legal requirements change. Material changes will be communicated through an appropriate in-service notice, email where suitable, or another reasonable method before they take effect when required. The effective and last-updated dates identify the published version.</p>
      </LegalSection>

      <LegalSection id="contact" title="16. Contact">
        <p>Controller: <strong>{"{{LEGAL_ENTITY_NAME}}"}</strong><br />Address: <strong>{"{{LEGAL_ENTITY_ADDRESS}}"}</strong><br />Privacy contact: <strong>{"{{PRIVACY_CONTACT_EMAIL}}"}</strong></p>
      </LegalSection>
    </LegalPageShell>
  );
}
