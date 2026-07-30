import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy | UntapGo",
  description: "The cookies, local storage, service worker and push technologies used by UntapGo.",
  alternates: { canonical: "https://untapgo.com/cookies" },
};

const toc=[["meaning","What these technologies are"],["uses","How UntapGo uses them"],["inventory","Storage inventory"],["providers","Third parties"],["basis","Legal basis"],["controls","Your controls"],["changes","Changes"],["contact","Contact"]].map(([id,label])=>({id,label}));

export default function CookiesPage(){
  return <LegalPageShell title="Cookie Policy" introduction="UntapGo uses browser storage and related technologies to keep accounts signed in, remember choices and deliver push notifications when requested. It does not currently use advertising or analytics trackers." toc={toc}>
    <LegalSection id="meaning" title="1. Cookies and similar technologies">
      <p>A cookie is a small value a website asks a browser to store and return. Web applications can also use localStorage, IndexedDB, service workers, notification permission and push subscriptions. This policy covers all of them because they can remember a browser or support a feature even when they are not literal cookies.</p>
      <p>The current frontend reads and writes localStorage and registers a Firebase messaging service worker. Supabase’s browser authentication client also persists session information in browser storage. The repository contains no direct use of <code>document.cookie</code>, sessionStorage or application-created IndexedDB databases. Browsers and verified providers may still manage technical storage as part of authentication, map rendering or push delivery.</p>
    </LegalSection>
    <LegalSection id="uses" title="2. How UntapGo uses storage">
      <h3>Strictly necessary storage</h3>
      <p>Authentication storage keeps a signed-in session and supplies an access token to the UntapGo backend. Without it, account features such as profiles, event participation and settings cannot work reliably. Security storage used by Supabase during authentication is also necessary for the sign-in flow.</p>
      <h3>Preferences and requested features</h3>
      <p>UntapGo remembers the area, coordinates and radius you selected for nearby-event results. These choices stay on the device until cleared or replaced. Your distance-unit preference is stored with your account through the backend rather than in a separate UntapGo localStorage key. Device geolocation is not read silently: it uses the browser permission prompt when you ask for your current location.</p>
      <p>If you choose to enable push notifications, UntapGo creates a random device identifier, records that push is enabled, registers a service worker and asks Firebase Cloud Messaging for a push token. Push is optional and requires the browser’s notification permission.</p>
      <h3>No analytics or marketing categories</h3>
      <p>No analytics, advertising, conversion-tracking or marketing technology was found in the inspected implementation. Because only necessary storage and user-requested preferences/features are present, UntapGo does not show a general cookie-consent banner. If optional tracking is added, it must be blocked until valid consent and this policy and the interface must be updated.</p>
    </LegalSection>
    <LegalSection id="inventory" title="3. Current inventory">
      <div className="legal-table-wrap"><table><thead><tr><th>Name or pattern</th><th>Provider / purpose</th><th>Type and party</th><th>Duration</th><th>Consent</th></tr></thead><tbody>
        <tr><td><code>sb-{"<project-ref>"}-auth-token</code> and related Supabase auth keys</td><td>Supabase; persist the authenticated session and refresh it</td><td>localStorage, first-party context</td><td>Until sign-out, account/session expiry or browser data is cleared; token lifetimes are managed by Supabase</td><td>Strictly necessary; no consent panel</td></tr>
        <tr><td><code>supabase_token</code></td><td>UntapGo; provides the current access token to authenticated application requests</td><td>localStorage, first party</td><td>Removed when the app observes sign-out; otherwise replaced with the current session token</td><td>Strictly necessary</td></tr>
        <tr><td><code>untapgo_coords</code></td><td>UntapGo; remembers selected or permitted device coordinates for nearby results</td><td>localStorage, first party</td><td>Until replaced or browser data is cleared</td><td>Requested feature; device geolocation separately requires browser permission</td></tr>
        <tr><td><code>untapgo_location_label</code></td><td>UntapGo; remembers the human-readable selected area</td><td>localStorage, first party</td><td>Until replaced or cleared</td><td>Preference; no consent panel</td></tr>
        <tr><td><code>untapgo_radius</code></td><td>UntapGo; remembers event-search radius</td><td>localStorage, first party</td><td>Until replaced or cleared</td><td>Preference; no consent panel</td></tr>
        <tr><td><code>untapgo:push-device-id</code></td><td>UntapGo; distinguishes a browser installation when saving or deleting its FCM token</td><td>localStorage, first party</td><td>Until browser data is cleared</td><td>Created when push-device functionality is used</td></tr>
        <tr><td><code>untapgo:push-enabled</code></td><td>UntapGo; remembers that this device completed push setup</td><td>localStorage, first party</td><td>Removed when push is disabled; otherwise until cleared</td><td>Consent through the requested push flow and browser permission</td></tr>
        <tr><td><code>/firebase-messaging-sw.js</code>, FCM token and browser push subscription</td><td>UntapGo / Google Firebase; receive and display optional push messages</td><td>Service worker and push/browser-managed storage; first- and third-party service</td><td>Until push is disabled, token expires/is replaced, service worker is removed or browser data is cleared</td><td>Yes, requested through notification permission</td></tr>
        <tr><td>Mapbox Search session token</td><td>Mapbox; groups suggestion and retrieval requests during a place-search session</td><td>In-memory request value sent to a third party</td><td>One search-component session; not deliberately persisted by UntapGo</td><td>Used only when place search is used; provider storage requires verification</td></tr>
      </tbody></table></div>
      <p>Exact Supabase key names include a project reference determined by configuration. Exact token expiry and third-party infrastructure storage are controlled by the relevant service and must not be inferred from this frontend.</p>
    </LegalSection>
    <LegalSection id="providers" title="4. Third-party technologies">
      <p>Supabase provides authentication and may use browser storage necessary to complete, maintain and refresh a session. Mapbox receives place-search requests, coordinates and ordinary network information when its maps and search APIs are used. Google Firebase receives messaging configuration and a push token when push is enabled. Scryfall-hosted card images may receive ordinary web-request data when loaded, but the frontend does not deliberately set a Scryfall cookie.</p>
      <p>Those providers may operate infrastructure storage outside the code UntapGo controls. Their own notices explain their independent practices. The frontend does not establish whether the hosting platform sets infrastructure or security cookies, so <strong>{"{{HOSTING_COOKIE_INVENTORY}}"}</strong> must be checked in production.</p>
    </LegalSection>
    <LegalSection id="basis" title="5. Legal basis">
      <p>Authentication and security storage is necessary to perform the account agreement and protect the service. Location-label and radius storage implement choices you request and support the service agreement. Access to device geolocation and delivery of browser push rely on your affirmative browser permission and consent. Consent can be withdrawn at any time.</p>
      <p>UntapGo does not ask for consent for storage that is strictly necessary to sign in or provide a specifically requested feature. It also does not treat continued browsing or scrolling as consent.</p>
    </LegalSection>
    <LegalSection id="controls" title="6. Managing and withdrawing choices">
      <p>You can disable push in UntapGo notification settings and revoke notification permission in browser or operating-system settings. The app asks its backend to remove the token for that device and asks Firebase to delete the local token on disable, although browser-managed data may also need to be cleared through browser settings.</p>
      <p>You can revoke location permission in browser settings. You can change the selected area and radius in UntapGo. Clearing site data removes local preferences, device identifiers and local authentication data. Blocking all local storage may sign you out, prevent session refresh, forget preferences and stop push or nearby-event features from working.</p>
      <p>Because no non-essential analytics or marketing technology is active, there is no separate “Cookie preferences” panel. Browser controls are the appropriate current mechanism. A consent panel must be added before any optional tracker is deployed.</p>
    </LegalSection>
    <LegalSection id="changes" title="7. Changes to this policy"><p>This inventory will be updated when storage behavior, providers or purposes change. A material change involving optional tracking will be presented before that tracking begins, where consent is required.</p></LegalSection>
    <LegalSection id="contact" title="8. Contact"><p>Questions about browser storage or personal data may be sent to <strong>{"{{PRIVACY_CONTACT_EMAIL}}"}</strong>. Operator: <strong>{"{{LEGAL_ENTITY_NAME}}"}</strong>, <strong>{"{{LEGAL_ENTITY_ADDRESS}}"}</strong>.</p></LegalSection>
  </LegalPageShell>;
}
