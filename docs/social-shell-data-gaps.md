# Social shell data gaps

The frontend currently has no authorized aggregate API for a unified conversation inbox or Binder trade threads. The shell therefore renders only existing Playgroup chat destinations and does not fabricate conversations.

## Unified conversations

The smallest useful authenticated endpoint is:

`GET /conversations?types=playgroup,trade&limit=20&cursor=<opaque>`

Each privacy-filtered row should contain a stable conversation ID, type, display title, optional safe avatar, short context label, validated internal `href`, last-message preview and timestamp when authorized, and a genuine unread count. The backend must filter blocked users and inaccessible Playgroups before returning rows. One aggregate inbox Realtime topic should update the list; the frontend must not subscribe once per row.

Accepted Binder interests should create exactly one trade conversation and return its internal route. Until that workflow and route exist, the frontend does not label accepted interests as trade chats.

Community Binder discovery, Community Deck discovery, and Saved Decks now use their dedicated authenticated endpoints. None of those views scans profiles or private collections in the browser.
