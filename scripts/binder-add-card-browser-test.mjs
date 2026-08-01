import { randomBytes } from "node:crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const appUrl = (process.env.BINDER_TEST_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const chromeDebugUrl = process.env.BINDER_TEST_CDP_URL ?? "http://127.0.0.1:9226";
const printingId = "38afc2f2-29d2-413d-abee-d8ad9fa85dec";

if (!supabaseUrl || !anonKey || !serviceKey || !apiUrl) {
  throw new Error("Supabase and frontend API environment variables are required");
}

const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};
let createdUserId = null;

async function checkedFetch(url, init, label) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${label} failed (${response.status}): ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function createAccount() {
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `codex-binder-${suffix}@example.invalid`;
  const password = `${randomBytes(18).toString("base64url")}aA1!`;
  const nickname = `Binder Runtime ${suffix.slice(-8)}`;
  const user = await checkedFetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { nickname } }),
  }, "create Binder test account");
  createdUserId = user.id;
  await checkedFetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: { ...serviceHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: user.id, nickname }),
  }, "create Binder test profile");
  return checkedFetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }, "authenticate Binder test account");
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(operation, label, timeout = 25_000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await operation();
    if (last) return last;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}; last=${JSON.stringify(last)}`);
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

function sessionCookies(session) {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  const key = `sb-${ref}-auth-token`;
  const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  if (encoded.length <= 3180) return [{ name: key, value: encoded }];
  const cookies = [];
  for (let offset = 0; offset < encoded.length; offset += 3180) {
    cookies.push({ name: `${key}.${cookies.length}`, value: encoded.slice(offset, offset + 3180) });
  }
  return cookies;
}

const instrumentation = `(() => {
  window.__binderRuntimeRequests = [];
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const response = await originalFetch(input, init);
    if (url.includes('/binder/items') || url.includes('/cards/')) {
      let responseBody = '';
      try { responseBody = await response.clone().text(); } catch {}
      window.__binderRuntimeRequests.push({
        url,
        method: init.method || (typeof input === 'string' ? 'GET' : input.method),
        requestBody: typeof init.body === 'string' ? init.body : null,
        status: response.status,
        responseBody,
      });
    }
    return response;
  };
})();`;

async function openBinder(cdp, session) {
  const { browserContextId } = await cdp.send("Target.createBrowserContext");
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await Promise.all([
    cdp.send("Page.enable", {}, sessionId),
    cdp.send("Runtime.enable", {}, sessionId),
    cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: instrumentation }, sessionId),
  ]);
  await cdp.send("Page.navigate", { url: appUrl }, sessionId);
  await waitFor(() => evaluate(cdp, sessionId, "document.readyState === 'complete'"), "application origin");
  for (const cookie of sessionCookies(session)) {
    await evaluate(cdp, sessionId, `document.cookie = ${JSON.stringify(`${cookie.name}=${cookie.value}; Path=/; SameSite=Lax`)}; true`);
  }
  await evaluate(cdp, sessionId, `localStorage.setItem('supabase_token', ${JSON.stringify(session.access_token)}); true`);
  await cdp.send("Page.navigate", { url: `${appUrl}/binder` }, sessionId);
  await waitFor(
    () => evaluate(cdp, sessionId, "Boolean(Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Add card'))"),
    "Binder Add card action",
  );
  return sessionId;
}

let cdp;
try {
  const session = await createAccount();
  const version = await checkedFetch(`${chromeDebugUrl}/json/version`, {}, "Chrome DevTools");
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.open();
  const sessionId = await openBinder(cdp, session);

  await evaluate(cdp, sessionId, `Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Add card').click(); true`);
  await waitFor(() => evaluate(cdp, sessionId, "Boolean(document.querySelector('[role=dialog]'))"), "Add card modal");

  const initialPrice = await evaluate(cdp, sessionId, `(() => {
    const input = document.querySelector('input[placeholder="0.00"]');
    const currency = input.parentElement.querySelector('select');
    return { value: input.value, valueAsNumber: Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber, placeholder: input.placeholder, currencyValue: currency.value, currencyDisabled: currency.disabled };
  })()`);
  const initialCombobox = await evaluate(cdp, sessionId, `(() => {
    const input = document.querySelector('#binder-card-search');
    return { expanded: input.getAttribute('aria-expanded'), suggestions: document.querySelectorAll('[role=option]').length };
  })()`);

  await evaluate(cdp, sessionId, `(() => {
    const input = document.querySelector('#binder-card-search');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Cauldron Familiar');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  const searchingCombobox = await waitFor(
    () => evaluate(cdp, sessionId, `(() => {
      const input = document.querySelector('#binder-card-search');
      const option = Array.from(document.querySelectorAll('[role=option]')).find((node) => node.textContent.trim() === 'Cauldron Familiar');
      return option ? { expanded: input.getAttribute('aria-expanded'), suggestions: document.querySelectorAll('[role=option]').length } : null;
    })()`),
    "Cauldron Familiar autocomplete",
  );
  await evaluate(cdp, sessionId, `Array.from(document.querySelectorAll('[role=option]')).find((node) => node.textContent.trim() === 'Cauldron Familiar').click(); true`);
  const afterSuggestionClick = await evaluate(cdp, sessionId, `(() => {
    const input = document.querySelector('#binder-card-search');
    return { expanded: input.getAttribute('aria-expanded'), suggestions: document.querySelectorAll('[role=option]').length };
  })()`);

  await waitFor(
    () => evaluate(cdp, sessionId, `Boolean(document.querySelector('#binder-printing option[value="${printingId}"]'))`),
    "Secret Lair exact printing",
  );
  await evaluate(cdp, sessionId, `(() => {
    const select = document.querySelector('#binder-printing');
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(select, '${printingId}');
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  const selectedPreview = await evaluate(cdp, sessionId, `(() => {
    const select = document.querySelector('#binder-printing');
    return { id: select.value, label: select.selectedOptions[0].textContent.trim(), preview: select.parentElement.innerText };
  })()`);

  await evaluate(cdp, sessionId, `(() => {
    const dialog = document.querySelector('[role=dialog]');
    Array.from(dialog.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Add card').click();
    return true;
  })()`);
  const request = await waitFor(
    () => evaluate(cdp, sessionId, `window.__binderRuntimeRequests.find((request) => request.method === 'POST' && request.url.endsWith('/binder/items')) || null`),
    "Binder item POST",
  );
  const cardSearch = await evaluate(cdp, sessionId, `window.__binderRuntimeRequests.find((request) => request.url.includes('/cards/search')) || null`);
  const selectedCard = cardSearch
    ? JSON.parse(cardSearch.responseBody).data.find((card) => card.id === printingId)
    : null;
  const finalUi = await evaluate(cdp, sessionId, `({
    modalOpen: Boolean(document.querySelector('[role=dialog]')),
    binderHasSelectedCard: document.body.innerText.includes('Cauldron Familiar') && !document.querySelector('[role=dialog]'),
    visibleError: Array.from(document.querySelectorAll('[role=alert]')).map((node) => node.textContent.trim()),
  })`);

  console.log(JSON.stringify({
    authenticatedBrowser: true,
    query: "Cauldron Familiar",
    selectedCard,
    selectedPreview,
    comboboxTransitions: {
      initial: initialCombobox,
      searching: searchingCombobox,
      afterSelection: afterSuggestionClick,
    },
    initialPrice,
    post: {
      url: request.url,
      payload: JSON.parse(request.requestBody),
      status: request.status,
      response: JSON.parse(request.responseBody),
    },
    finalUi,
  }, null, 2));
} finally {
  if (cdp) cdp.close();
  if (createdUserId) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${createdUserId}`, {
      method: "DELETE",
      headers: serviceHeaders,
    });
  }
}
