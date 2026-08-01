# Social shell data gaps

The frontend currently has no authorized aggregate API for a unified inbox, Binder discovery, community Decks, or saved Decks. The shell therefore renders only existing Playgroup chat destinations and does not fabricate conversation or discovery data.

## Unified conversations

The smallest useful authenticated endpoint is:

`GET /conversations?types=playgroup,trade&limit=20&cursor=<opaque>`

Each privacy-filtered row should contain a stable conversation ID, type, display title, optional safe avatar, short context label, validated internal `href`, last-message preview and timestamp when authorized, and a genuine unread count. The backend must filter blocked users and inaccessible Playgroups before returning rows. One aggregate inbox Realtime topic should update the list; the frontend must not subscribe once per row.

Accepted Binder interests should create exactly one trade conversation and return its internal route. Until that workflow and route exist, the frontend does not label accepted interests as trade chats.

## Community Binder discovery

The smallest useful endpoint is a privacy-safe paginated `GET /binder/community` supporting card filters and `nearest`, `recent`, `card_name`, and `asking_price` ordering. Results should include only public active listings and approximate distance buckets when relevant—never coordinates or another private profile field.

## Community and saved Decks

Community Decks need a paginated `GET /decks/community` that returns only profile- and Deck-level public records and supports recent, updated, format, followed-player, and genuine saved-count ordering. Saved Decks need an authenticated paginated `GET /me/decks/saved`. Neither view should be assembled by scanning profiles in the browser.
