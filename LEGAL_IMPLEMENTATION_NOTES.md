# UntapGo legal implementation notes

Private developer document. Do not serve or link this file from the application.

## Unresolved placeholders

- `{{LEGAL_ENTITY_NAME}}`
- `{{LEGAL_ENTITY_LEGAL_FORM}}`
- `{{LEGAL_ENTITY_ADDRESS}}`
- `{{COMPANY_REGISTRATION_NUMBER}}`
- `{{LEGAL_CONTACT_EMAIL}}`
- `{{PRIVACY_CONTACT_EMAIL}}`
- `{{MINIMUM_USER_AGE}}`
- `{{GOVERNING_LAW}}`
- `{{COMPETENT_COURTS}}`
- `{{FRONTEND_HOSTING_PROVIDER}}`
- `{{BACKEND_HOSTING_PROVIDER}}`
- `{{INTERNATIONAL_TRANSFER_INFORMATION}}`
- `{{ACCOUNT_DELETION_BEHAVIOUR}}`
- `{{CURRENT_PRICING_STATUS}}`
- `{{HOSTING_COOKIE_INVENTORY}}`

## Factual assumptions deliberately avoided

- No company name, legal form, registration number, address, VAT number, email, DPO, minimum age, governing law, court or dispute-resolution body was inferred.
- No fixed retention or backup-deletion period was invented.
- The frontend does not prove the production frontend/backend host, email provider, provider regions, processor roles, or international-transfer safeguard.
- Vercel and Fly.io were not named as active hosts merely because the brief suggested them or a default Vercel asset exists.
- Resend was not named because no frontend integration or configuration was found.
- Google OAuth was not described as active: the login page implements Supabase email/password only and no `signInWithOAuth` call exists.
- The service was not called free or beta; no billing code was found, but business status is not proven by absence of a checkout.
- No analytics, advertising, error monitoring, Trust Score, formal moderation appeal, emergency response time or marketing email was claimed.
- Account deletion was not described row-by-row because the frontend only proves `DELETE /me`, followed by Supabase sign-out.

## Third-party services detected

- Supabase JavaScript client: authentication/session persistence and avatar object storage. The project may use more Supabase services, but backend database use is not proven by this frontend alone.
- Google Firebase Cloud Messaging: web push configuration, token creation/deletion, foreground messaging and messaging service worker.
- Mapbox: GL maps, tiles/styles, Search Box suggestions/retrieval and legacy geocoding requests.
- Scryfall: card/search model identifiers and `cards.scryfall.io` artwork URLs used by deck/profile functionality.
- Google Maps: an outbound user-clicked search URL on event detail pages; not embedded tracking or OAuth.
- UntapGo backend API at a public environment-configured base URL; production host/provider not recorded here.

## Cookies and storage technologies detected

- Supabase browser auth localStorage key pattern `sb-<project-ref>-auth-token` and related SDK-managed auth storage.
- `supabase_token` in localStorage.
- `untapgo_coords`, `untapgo_radius`, `untapgo_location_label` in localStorage.
- Distance-unit preference is account-backed through `/me/preferences/display`; no dedicated localStorage key was found.
- `untapgo:push-device-id` and `untapgo:push-enabled` in localStorage.
- Firebase messaging service worker at `/firebase-messaging-sw.js`, FCM registration token, browser Push API and Notifications API.
- Browser Geolocation API, used only through an explicit current-location request.
- Mapbox Search session token held in component memory and sent with search requests.
- No direct `document.cookie`, sessionStorage, application-created IndexedDB, analytics or marketing trackers found.
- Production infrastructure/security cookies and provider-internal storage must be tested in a deployed browser session.

## Lawyer review required

- Complete and validate every placeholder against official corporate and contact records.
- Confirm GDPR controller/processor roles, data-processing agreements, sub-processors, regions and international transfers for every provider.
- Review legal bases, especially event safety/moderation legitimate interests, location, optional push and attendance history.
- Set the minimum age and determine whether Estonian or other child-consent/safeguarding rules require more controls.
- Review the liability, moderation, termination, user-content licence, governing-law and courts clauses under Estonian and applicable EU consumer law.
- Confirm any applicable Estonia/EU consumer information and alternative dispute-resolution obligations.
- Decide and document retention/deletion schedules, legal holds and backup handling.
- Confirm whether a VAT number, regulated contact method, accessibility statement or other operator notice is legally required.
- Review use of Wizards of the Coast trademarks and Scryfall data/artwork under applicable licences and brand policies.
- Validate that the Estonian Data Protection Inspectorate reference and complaint wording are appropriate for the final operator.
- Review offline-event/minor safety requirements and whether venue hosts need additional terms.

## Functionality requiring manual verification

- Backend database schema and all information actually stored for profiles, events, requests, attendance, feedback, reports, blocks, favourites, decks and notifications.
- Public/anonymous event visibility, exact address and coordinates returned to each audience, and effects of blocks across events and maps.
- Backend enforcement of all four profile privacy fields and event deck visibility (`private`, `name`, `full`).
- Who can access reports, event feedback, attendance records and moderation evidence; whether users receive reasons for enforcement.
- Exact effects and timing of `DELETE /me`, including Supabase Auth user deletion, avatars, decks, events, public content, reports, blocks, logs and backups.
- Server/security log fields, purpose, access controls and retention.
- FCM token deletion on disable, stale-token cleanup and notification preference enforcement.
- Whether transactional email is sent, by which provider, for which purposes and with what retained delivery metadata.
- Deployed frontend/backend hosting providers, CDN/security services and production cookies/headers.
- Mapbox and Scryfall request behavior in production, including provider storage and geographic routing.
- Whether the service is presently free and whether any off-platform fee or paid venue feature is supported.
- Operational availability of legal/privacy contacts and reporting workflow.
- Browser checks at 320, 390, 768 and desktop widths, plus print preview, with final production fonts/header behavior.
