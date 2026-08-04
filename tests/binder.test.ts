import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CircleCheck, CircleX, Handshake } from "lucide-react";

import {
  allowedInterestTypes,
  binderItemSaveErrorFields,
  buildCommunityBinderPath,
  buildBinderItemsPath,
  buildInterestsPath,
  buildMatchesPath,
  buildWantedPath,
  formatAskingPriceInput,
  mergeUnique,
  normalizeBinderView,
  normalizeItemSubmission,
  normalizeWantedSubmission,
  parseOptionalAskingPrice,
  reasonLabel,
  shouldSearchCardQuery,
  type BinderFilters,
  type CommunityBinderFilters,
} from "../lib/binder.ts";
import {
  getNotificationActivityCopy,
  getNotificationHref,
  getNotificationPresentation,
} from "../lib/notification-presentation.ts";

const filters: BinderFilters = {
  q: "  Black Lotus  ",
  availability: "trade",
  condition: "lp",
  finish: "nonfoil",
  set_code: "  LEA ",
  status: "active",
};

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Binder view routing defaults invalid values and supports all owner sections", () => {
  assert.equal(normalizeBinderView("unknown"), "community");
  assert.equal(normalizeBinderView(undefined), "community");
  for (const view of ["community", "items", "wanted", "matches", "received", "sent", "trades"] as const) {
    assert.equal(normalizeBinderView(view), view);
  }
  const dashboard = source("../components/binder/BinderDashboard.tsx");
  const metadata = source("../components/social-shell/navigation.ts");
  assert.match(metadata, /label: "Community"/);
  assert.match(metadata, /label: "My Binder"/);
  assert.doesNotMatch(dashboard, /My Binders/);
  assert.match(dashboard, /<CommunityBinderView \/>/);
  assert.match(dashboard, /<SectionNavigation[\s\S]*section="binder"/);
  assert.match(dashboard, /view === "items"/);
  assert.match(dashboard, /view === "wanted"/);
  assert.match(dashboard, /view === "matches"/);
  assert.match(dashboard, /<InterestsView view=\{view\}/);
  assert.match(dashboard, /view === "items" \? \(/);
  assert.match(dashboard, /Share Binder/);
  assert.match(dashboard, /<TradeThreadsView \/>/);
  assert.match(dashboard, /view === "items" \? <div className="mt-4"><BinderSettingsPanel/);
});

test("Community Binder path includes every database-backed filter", () => {
  const communityFilters: CommunityBinderFilters = {
    q: "  Familiar ", availability: "sell", condition: "nm", finish: "foil",
    set_code: " ELD ", language: " EN ", min_price: "1", max_price: "5", sort: "price_low",
  };
  const path = new URL(buildCommunityBinderPath(communityFilters, 2), "https://test.local");
  assert.equal(path.pathname, "/binder/community");
  assert.equal(path.searchParams.get("q"), "Familiar");
  assert.equal(path.searchParams.get("set_code"), "eld");
  assert.equal(path.searchParams.get("language"), "en");
  assert.equal(path.searchParams.get("min_price"), "1");
  assert.equal(path.searchParams.get("max_price"), "5");
  assert.equal(path.searchParams.get("sort"), "price_low");
  assert.equal(path.searchParams.get("page"), "2");
});

test("Community Binder loads the real endpoint with stale-safe pagination and structured interest", () => {
  const service = source("../services/binder.ts");
  const view = source("../components/binder/CommunityBinderView.tsx");
  const filterControls = source("../components/binder/CommunityBinderFilters.tsx");
  const hook = source("../hooks/usePaginatedResource.ts");
  const card = source("../components/binder/BinderCard.tsx");
  assert.match(service, /community: \(filters: CommunityBinderFilters, page: number\)/);
  assert.match(service, /buildCommunityBinderPath/);
  assert.match(view, /binderApi\.community/);
  assert.match(view, /binderApi\.createInterest/);
  assert.match(view, /<LoadMore/);
  assert.match(view, /item\.owner\.nickname/);
  assert.match(view, /item\.proximity\.label/);
  assert.match(filterControls, /window\.setTimeout/);
  for (const label of ["Availability", "Condition", "Finish", "Set code", "Language", "Minimum price", "Maximum price"]) assert.match(filterControls, new RegExp(label));
  assert.match(hook, /requestId !== sequence\.current/);
  assert.match(hook, /mergeUnique/);
  assert.match(card, /footer/);
  assert.doesNotMatch(view, /onEdit|onStatus|onWithdraw|BinderSettingsPanel|Add card/);
});

test("Binder section navigation uses the desktop sidebar and compact selector on mobile", () => {
  const dashboard = source("../components/binder/BinderDashboard.tsx");
  const navigation = source("../components/section-navigation/SectionNavigation.tsx");
  const sidebar = source("../components/social-shell/SocialDesktopSidebar.tsx");
  assert.match(sidebar, /<SocialContextualNavigation \/>/);
  assert.doesNotMatch(dashboard, /lg:grid-cols-\[196px_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(navigation, /<aside|w-\[196px\]/);
  assert.match(navigation, /<select/);
  assert.match(navigation, /router\.push\(event\.target\.value\)/);
  assert.match(navigation, /lg:hidden/);
  assert.doesNotMatch(dashboard, /overflow-x-auto/);
});

test("owner and public filters target server endpoints with normalized pagination", () => {
  const owner = new URL(buildBinderItemsPath(filters, 3), "https://test.local");
  assert.equal(owner.pathname, "/binder/items");
  assert.equal(owner.searchParams.get("q"), "Black Lotus");
  assert.equal(owner.searchParams.get("set_code"), "lea");
  assert.equal(owner.searchParams.get("status"), "active");
  assert.equal(owner.searchParams.get("page"), "3");

  const publicPath = new URL(buildBinderItemsPath(filters, 2, 24, "user/id"), "https://test.local");
  assert.equal(publicPath.pathname, "/profiles/user%2Fid/binder");
  assert.equal(publicPath.searchParams.get("status"), null);
  assert.equal(buildWantedPath(2), "/binder/wanted?page=2&page_size=24");
  assert.equal(buildMatchesPath(4), "/binder/matches?page=4&page_size=24");
  assert.equal(buildInterestsPath("sent", 2), "/binder/interests?view=sent&page=2&page_size=20");
});

test("normalized card submissions keep exact IDs, exact decimals, and trimmed text", () => {
  assert.deepEqual(normalizeItemSubmission({
    scryfall_card_id: "card-id",
    language: " EN ",
    finish: "foil",
    condition: "nm",
    quantity: 1000,
    availability: "both",
    asking_price: 12.345,
    currency: "EUR",
    notes: "  Trade context  ",
  }), {
    scryfall_card_id: "card-id",
    language: "en",
    finish: "foil",
    condition: "nm",
    quantity: 999,
    availability: "both",
    asking_price: 12.35,
    currency: "EUR",
    notes: "Trade context",
  });

  assert.deepEqual(normalizeWantedSubmission({
    scryfall_card_id: "printing",
    match_any_printing: true,
    quantity: 0,
    minimum_condition: null,
    preferred_language: " JA ",
    preferred_finish: null,
    notes: "  matching note ",
  }), {
    scryfall_card_id: "printing",
    match_any_printing: true,
    quantity: 1,
    minimum_condition: null,
    preferred_language: "ja",
    preferred_finish: null,
    notes: "matching note",
  });
});

test("optional asking price stays empty or serializes as a positive price/currency pair", () => {
  assert.deepEqual(parseOptionalAskingPrice("   ", "EUR"), {
    ok: true,
    asking_price: null,
    currency: null,
  });
  assert.equal(formatAskingPriceInput(""), "");
  assert.deepEqual(parseOptionalAskingPrice("0", "EUR"), {
    ok: false,
    message: "Asking price must be greater than zero.",
  });
  assert.deepEqual(parseOptionalAskingPrice("12.5", "EUR"), {
    ok: true,
    asking_price: 12.5,
    currency: "EUR",
  });
  assert.equal(formatAskingPriceInput("12.5"), "12.50");
  assert.throws(() => normalizeItemSubmission({
    scryfall_card_id: "card-id",
    language: "en",
    finish: "nonfoil",
    condition: "nm",
    quantity: 1,
    availability: "both",
    asking_price: 0,
    currency: "EUR",
    notes: null,
  }), /positive asking price/);
});

test("pagination deduplicates IDs and interest types honor listing availability", () => {
  const current = [{ id: "one" }, { id: "two", value: "old" }];
  const merged = mergeUnique(current, [{ id: "two", value: "new" }, { id: "three" }], (item) => item.id);
  assert.deepEqual(merged, [{ id: "one" }, { id: "two", value: "new" }, { id: "three" }]);
  assert.deepEqual(allowedInterestTypes("trade"), ["trade"]);
  assert.deepEqual(allowedInterestTypes("sell"), ["buy"]);
  assert.deepEqual(allowedInterestTypes("both"), ["trade", "buy", "either"]);
});

test("card selection is debounced, stale-safe, exact-printing aware, and finish filtered", () => {
  const selector = source("../components/binder/CardPrintingSelector.tsx");
  const form = source("../components/binder/BinderItemForm.tsx");
  assert.match(selector, /window\.setTimeout/);
  assert.match(selector, /requestId === sequence\.current/);
  assert.match(selector, /oracleid:/);
  assert.match(selector, /"prints"/);
  assert.match(selector, /Exact printing/);
  assert.match(form, /selectedCard\?\.finishes\?\.filter/);
  assert.match(form, /if \(!finishes\.includes\(finish\)\)/);
  assert.match(form, /if \(saving\) return/);
});

test("selecting a card closes and clears autocomplete without a selected-name re-search", () => {
  const selector = source("../components/binder/CardPrintingSelector.tsx");
  const selection = selector.split("async function chooseCard", 2)[1].split("function editQuery", 1)[0];
  assert.match(selection, /setSuggestions\(\[\]\)/);
  assert.match(selection, /setHighlightedSuggestion\(-1\)/);
  assert.match(selection, /setIsSearchOpen\(false\)/);
  assert.match(selection, /onChange\(available\[0\] \?\? card\)/);
  assert.match(selector, /isSearchOpen && suggestions\.length/);
  assert.equal(shouldSearchCardQuery({
    query: "Cauldron Familiar",
    hasSelectedCard: true,
    isSearchOpen: true,
    loadingPrintings: false,
  }), false);
  assert.equal(shouldSearchCardQuery({
    query: "Cauldron Familiar",
    hasSelectedCard: false,
    isSearchOpen: true,
    loadingPrintings: false,
  }), true);
});

test("editing, Escape, outside click, and keyboard selection preserve combobox behavior", () => {
  const selector = source("../components/binder/CardPrintingSelector.tsx");
  const edit = selector.split("function editQuery", 2)[1].split("function handleSearchKeyDown", 1)[0];
  assert.match(edit, /setPrintings\(\[\]\)/);
  assert.match(edit, /onChange\(null\)/);
  assert.match(selector, /event\.key === "Escape"/);
  assert.match(selector, /document\.addEventListener\("pointerdown", closeOnOutsidePointer\)/);
  assert.match(selector, /document\.removeEventListener\("pointerdown", closeOnOutsidePointer\)/);
  assert.match(selector, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
  assert.match(selector, /role="combobox"/);
  assert.match(selector, /role="listbox"/);
  assert.match(selector, /role="option"/);
});

test("card saves use the exact selected printing and successful responses update immediately", () => {
  const form = source("../components/binder/BinderItemForm.tsx");
  const items = source("../components/binder/BinderItemsView.tsx");
  assert.match(form, /scryfall_card_id: selectedCard\.id/);
  assert.match(form, /decksApi\.printingLanguages/);
  assert.match(form, /Printed language/);
  assert.match(form, /asking_price: parsedPrice\.asking_price/);
  assert.match(form, /currency: parsedPrice\.currency/);
  assert.match(form, /searchInputRef\.current\?\.focus\(\)/);
  assert.match(form, /priceInputRef\.current\?\.focus\(\)/);
  assert.match(items, /\[saved, \.\.\.items\.filter\(\(item\) => item\.id !== saved\.id\)\]/);
  assert.match(items, /setAdding\(false\)/);
  assert.match(items, /setEditing\(null\)/);
});

test("backend validation and duplicate conflicts map to safe field-level errors", () => {
  assert.deepEqual(binderItemSaveErrorFields({
    status: 409,
    code: "BINDER_ITEM_ALREADY_ACTIVE",
  }), { card: "That exact card is already active in your Binder." });
  assert.deepEqual(binderItemSaveErrorFields({
    status: 422,
    body: {
      detail: [{
        loc: ["body", "asking_price"],
        msg: "raw backend validation detail",
      }],
    },
  }), { price: "Enter a price greater than zero, or leave the price empty." });
  assert.deepEqual(binderItemSaveErrorFields({
    status: 503,
    code: "BINDER_UPSTREAM_UNAVAILABLE",
    body: { detail: "raw database detail" },
  }), { form: "Binder storage is temporarily unavailable. Please try again later." });
});

test("paginated views reset on scope, ignore stale responses, and isolate row mutations", () => {
  const hook = source("../hooks/usePaginatedResource.ts");
  const items = source("../components/binder/BinderItemsView.tsx");
  const interests = source("../components/binder/InterestsView.tsx");
  assert.match(hook, /activeScope\.current !== scope/);
  assert.match(hook, /requestId !== sequence\.current/);
  assert.match(hook, /mergeUnique/);
  assert.match(items, /\[item\.id\]/);
  assert.match(items, /item\.id === saved\.id/);
  assert.match(interests, /item\.id === updated\.id/);
  assert.match(interests, /withdrawInterest/);
});

test("public Binder authenticates before protected fetches and handles privacy safely", () => {
  const publicBinder = source("../components/binder/PublicBinder.tsx");
  const authCheck = publicBinder.indexOf("supabase.auth.getUser");
  const authenticatedChild = publicBinder.indexOf("<AuthenticatedPublicBinder");
  assert.ok(authCheck >= 0 && authCheck < authenticatedChild);
  assert.match(publicBinder, /error instanceof ApiError && error\.status === 404/);
  assert.match(publicBinder, /Binder unavailable/);
  assert.match(publicBinder, /<PublicWantedList ownerId=\{owner\.id\}/);
  assert.match(publicBinder, /Share Binder/);
});

test("Wanted, match, and interest UI covers create, edit, remove and row transitions", () => {
  const wanted = source("../components/binder/WantedListView.tsx");
  const matches = source("../components/binder/MatchCard.tsx");
  const received = source("../components/binder/InterestRow.tsx");
  assert.match(wanted, /createWanted/);
  assert.match(wanted, /updateWanted/);
  assert.match(wanted, /removeWanted/);
  assert.match(matches, /match\.owner/);
  assert.equal(reasonLabel("minimum_condition"), "Condition preference");
  assert.match(received, />Accept</);
  assert.match(received, />Decline</);
  assert.match(received, />Withdraw</);
  assert.match(received, /Open trade/);
});

test("profile links and mobile More navigation expose Binder directly", () => {
  const profileLinks = source("../components/profile/ProfileBinderLinks.tsx");
  const navigation = source("../components/social-shell/navigation.ts");
  assert.match(profileLinks, />Binder</);
  assert.match(profileLinks, />Wanted List</);
  assert.match(navigation, /key: "binder", label: "Binder", href: "\/binder"[\s\S]*?mobileSecondary: 1/);
  assert.match(navigation, /key: "playgroups", label: "Playgroups"[\s\S]*?mobilePrimary: 3/);
});

test("Binder notifications have safe internal hrefs and unknown types stay generic", () => {
  const types = [
    ["binder_interest_received", Handshake, "primary"],
    ["binder_interest_accepted", CircleCheck, "positive"],
    ["binder_interest_declined", CircleX, "neutral"],
  ] as const;
  for (const [type, icon, tone] of types) {
    const presentation = getNotificationPresentation(type);
    assert.equal(presentation.icon, icon);
    assert.equal(presentation.category, "social");
    assert.equal(presentation.tone, tone);
    assert.deepEqual(getNotificationActivityCopy({
      id: type,
      type,
      title: "Title",
      body: "Binder update.",
      meta: { href: "/binder?view=sent" },
      is_read: false,
      created_at: "2026-08-01T00:00:00Z",
    }), { primary: "Binder update." });
  }
  assert.equal(getNotificationHref({ id: "x", type: "binder_interest_received", title: "", body: "", meta: { href: "https://bad.test" }, is_read: false, created_at: "" }), "/notifications");
  assert.equal(getNotificationPresentation("future_binder_type").category, "generic");
});

test("mobile Binder grids avoid fixed wide layouts", () => {
  const items = source("../components/binder/BinderItemsView.tsx");
  const publicBinder = source("../components/binder/PublicBinder.tsx");
  assert.match(items, /grid-cols-2[\s\S]*lg:grid-cols-4/);
  assert.match(publicBinder, /grid-cols-2[\s\S]*lg:grid-cols-4/);
  assert.doesNotMatch(items, /min-w-\[[4-9]\d{2}px\]/);
});
