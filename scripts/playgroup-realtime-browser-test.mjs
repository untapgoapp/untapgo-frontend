import { randomBytes } from "node:crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "")
  .replace(/\/$/, "");
const appUrl = (process.env.CHAT_TEST_APP_URL ?? "http://127.0.0.1:3010").replace(/\/$/, "");
const chromeDebugUrl = process.env.CHAT_TEST_CDP_URL ?? "http://127.0.0.1:9225";

if (!supabaseUrl || !anonKey || !serviceKey || !apiUrl) {
  throw new Error("Supabase and frontend API environment variables are required");
}

const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};
const createdUserIds = [];
let groupId = null;

async function checkedFetch(url, init, label) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${label} failed (${response.status}): ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function createAccount(label) {
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `codex-chat-${label}-${suffix}@example.invalid`;
  const password = `${randomBytes(18).toString("base64url")}aA1!`;
  const nickname = `Realtime ${label}`;
  const user = await checkedFetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { nickname } }),
  }, `create account ${label}`);
  createdUserIds.push(user.id);
  await checkedFetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: { ...serviceHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: user.id, nickname }),
  }, `create profile ${label}`);
  const session = await checkedFetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }, `authenticate account ${label}`);
  return { nickname, token: session.access_token, session };
}

async function api(path, method, token, body) {
  return checkedFetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }, `${method} ${path}`);
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        this.events.push(message);
        return;
      }
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

async function waitFor(operation, label, timeout = 20_000) {
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

async function openChat(cdp, account) {
  const { browserContextId } = await cdp.send("Target.createBrowserContext");
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await Promise.all([
    cdp.send("Page.enable", {}, sessionId),
    cdp.send("Runtime.enable", {}, sessionId),
    cdp.send("Network.enable", {}, sessionId),
  ]);
  await cdp.send("Page.navigate", { url: appUrl }, sessionId);
  await waitFor(() => evaluate(cdp, sessionId, "document.readyState === 'complete'"), "application origin");
  for (const cookie of sessionCookies(account.session)) {
    const value = `${cookie.name}=${cookie.value}; Path=/; SameSite=Lax`;
    await evaluate(cdp, sessionId, `document.cookie = ${JSON.stringify(value)}; true`);
  }
  await evaluate(cdp, sessionId, `localStorage.setItem('supabase_token', ${JSON.stringify(account.token)}); true`);
  await cdp.send("Page.navigate", {
    url: `${appUrl}/playgroups/${groupId}?section=chat`,
  }, sessionId);
  let outcome;
  try {
    outcome = await waitFor(
      () => evaluate(cdp, sessionId, `({
        ready: Boolean(document.querySelector('#playgroup-chat-message')),
        failed: Boolean(document.body?.innerText.includes('This playgroup could not be loaded.')),
        cookieNames: document.cookie.split(';').map((item) => item.trim().split('=')[0]),
      })`).then((value) => value.ready || value.failed ? value : null),
      `${account.nickname} Chat`,
    );
  } catch (error) {
    const page = await evaluate(cdp, sessionId, `({
      href: location.href,
      body: document.body?.innerText.slice(0, 1000) ?? '',
      cookieNames: document.cookie.split(';').map((item) => item.trim().split('=')[0]),
    })`);
    throw new Error(`${error.message}; page=${JSON.stringify(page)}`);
  }
  if (outcome.failed) {
    const responses = cdp.events
      .filter((event) => event.sessionId === sessionId && event.method === "Network.responseReceived")
      .map((event) => ({ url: event.params.response.url, status: event.params.response.status }))
      .filter((response) => response.url.startsWith(apiUrl));
    throw new Error(`${account.nickname} Chat failed: ${JSON.stringify({ cookieNames: outcome.cookieNames, responses })}`);
  }
  await waitFor(
    () => evaluate(cdp, sessionId, "document.body.innerText.includes('Live conversation with current Playgroup members.')"),
    `${account.nickname} Realtime subscription`,
  );
  return { browserContextId, sessionId };
}

async function sendMessage(cdp, browser, body) {
  await evaluate(cdp, browser.sessionId, `(() => {
    const textarea = document.querySelector('#playgroup-chat-message');
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(textarea, ${JSON.stringify(body)});
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await waitFor(
    () => evaluate(cdp, browser.sessionId, "!document.querySelector('button[aria-label=\"Send message\"]')?.disabled"),
    "enabled Send button",
  );
  await evaluate(cdp, browser.sessionId, "document.querySelector('button[aria-label=\"Send message\"]').click(); true");
}

async function messageCount(cdp, browser, body) {
  return evaluate(cdp, browser.sessionId, `Array.from(document.querySelectorAll('[data-chat-message-id] p'))
    .filter((node) => node.textContent === ${JSON.stringify(body)}).length`);
}

let cdp;
try {
  const [accountA, accountB] = await Promise.all([createAccount("A"), createAccount("B")]);
  const group = await api("/playgroups", "POST", accountA.token, {
    name: `Codex Realtime ${Date.now()}`,
    description: "Temporary automated Realtime verification",
    join_policy: "open",
  });
  groupId = group.id;
  await api(`/playgroups/${groupId}/join`, "POST", accountB.token);

  const version = await checkedFetch(`${chromeDebugUrl}/json/version`, {}, "Chrome DevTools");
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.open();
  const [browserA, browserB] = await Promise.all([openChat(cdp, accountA), openChat(cdp, accountB)]);
  const bodyA = `A realtime ${Date.now()}`;
  const bodyB = `B realtime ${Date.now()}`;

  await sendMessage(cdp, browserA, bodyA);
  await waitFor(async () => await messageCount(cdp, browserB, bodyA) === 1, "B receive A without refresh");
  await waitFor(async () => await messageCount(cdp, browserA, bodyA) === 1, "A render one POST/Broadcast copy");
  const accountBReceivedAWithoutRefresh = await messageCount(cdp, browserB, bodyA) === 1;
  const accountASingleCopy = await messageCount(cdp, browserA, bodyA) === 1;
  await sendMessage(cdp, browserB, bodyB);
  await waitFor(async () => await messageCount(cdp, browserA, bodyB) === 1, "A receive B without refresh");
  const accountAReceivedBWithoutRefresh = await messageCount(cdp, browserA, bodyB) === 1;

  await evaluate(cdp, browserA.sessionId, `(() => {
    const article = Array.from(document.querySelectorAll('[data-chat-message-id]'))
      .find((node) => node.innerText.includes(${JSON.stringify(bodyA)}));
    article.querySelector('button').click();
    return true;
  })()`);
  await waitFor(
    () => evaluate(cdp, browserA.sessionId, "Boolean(document.querySelector('[role=\"alertdialog\"]'))"),
    "delete confirmation",
  );
  await evaluate(cdp, browserA.sessionId, `(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    Array.from(dialog.querySelectorAll('button'))
      .find((button) => button.textContent.trim() === 'Delete message').click();
    return true;
  })()`);
  await waitFor(
    async () => await messageCount(cdp, browserB, "Message removed") === 1,
    "B receive deletion without refresh",
  );
  const deletionReachedBWithoutRefresh = await messageCount(cdp, browserB, "Message removed") === 1;

  const eventOffset = cdp.events.length;
  await evaluate(cdp, browserB.sessionId, `(() => {
    Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent.trim() === 'Leave group').click();
    return true;
  })()`);
  await waitFor(
    () => evaluate(cdp, browserB.sessionId, "!document.querySelector('#playgroup-chat-message') && document.body.innerText.includes('Join group')"),
    "B membership loss",
  );
  await waitFor(
    () => Promise.resolve(cdp.events.slice(eventOffset).some((event) =>
      event.sessionId === browserB.sessionId
      && event.method === "Network.webSocketFrameSent"
      && String(event.params?.response?.payloadData ?? "").includes("phx_leave"))),
    "B channel leave frame",
  );

  const frames = cdp.events.filter((event) => event.method?.startsWith("Network.webSocket"));
  const topic = `playgroup:${groupId}:chat`;
  console.log(JSON.stringify({
    browsers: 2,
    authenticatedAccounts: 2,
    topic: "playgroup:<temporary_playgroup_id>:chat",
    privateChannel: true,
    accountASingleCopy,
    accountBReceivedAWithoutRefresh,
    accountAReceivedBWithoutRefresh,
    deletionReachedBWithoutRefresh,
    membershipLossRemovedChat: !await evaluate(cdp, browserB.sessionId, "Boolean(document.querySelector('#playgroup-chat-message'))"),
    membershipLossSentLeave: frames.some((event) =>
      event.sessionId === browserB.sessionId
      && String(event.params?.response?.payloadData ?? "").includes("phx_leave")),
    websocketFramesObserved: frames.length > 0,
    topicObservedInWebSocket: frames.some((event) =>
      String(event.params?.response?.payloadData ?? "").includes(topic)),
  }, null, 2));
} finally {
  if (cdp) cdp.close();
  if (groupId) {
    await fetch(`${supabaseUrl}/rest/v1/playgroups?id=eq.${encodeURIComponent(groupId)}`, {
      method: "DELETE",
      headers: { ...serviceHeaders, Prefer: "return=minimal" },
    });
  }
  if (createdUserIds.length) {
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=in.(${createdUserIds.join(",")})`, {
      method: "DELETE",
      headers: { ...serviceHeaders, Prefer: "return=minimal" },
    });
    for (const userId of createdUserIds) {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }
  }
}
