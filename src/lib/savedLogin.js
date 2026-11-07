// Credentials remembered on this device, so the login form can prefill them.
// Kept in one small module so the login flow stays stable across other edits.
const KEY = "saved_login_accounts";
const LEGACY_KEY = "saved_login";

const clean = value => (value || "").trim();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    const accounts = raw.accounts && typeof raw.accounts === "object" ? raw.accounts : {};
    let lastUsername = raw.lastUsername || "";
    if (!lastUsername) {
      // migrate the single saved credential written by older versions
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}");
      if (legacy.username && legacy.password) {
        accounts[legacy.username] = legacy.password;
        lastUsername = legacy.username;
      }
    }
    return { lastUsername, accounts };
  } catch (_) {
    return { lastUsername: "", accounts: {} };
  }
}

function write(lastUsername, accounts) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lastUsername, accounts }));
  } catch (_) { /* storage full or blocked */ }
}

// Exact key of a saved account, matched without case or surrounding spaces.
function findKey(accounts, username) {
  const wanted = clean(username).toLowerCase();
  if (!wanted) return "";
  return Object.keys(accounts).find(k => k.trim().toLowerCase() === wanted) || "";
}

// The credentials used most recently on this device.
export function getLastLogin() {
  const { lastUsername, accounts } = read();
  if (!lastUsername) return null;
  return { username: lastUsername, password: accounts[lastUsername] || "" };
}

// Every account saved on this device, most recently used first.
export function listLogins() {
  const { lastUsername, accounts } = read();
  const names = Object.keys(accounts);
  names.sort((a, b) => (a === lastUsername ? -1 : b === lastUsername ? 1 : 0));
  return names.map(username => ({ username, password: accounts[username] }));
}

// Password saved earlier for a specific username ("" when unknown).
export function getSavedPassword(username) {
  const { accounts } = read();
  const key = findKey(accounts, username);
  return key ? accounts[key] || "" : "";
}

// Remember these credentials and mark them as the last used.
export function saveLogin(username, password) {
  const name = clean(username);
  if (!name || !password) return;
  const { accounts } = read();
  const existing = findKey(accounts, name);
  if (existing) delete accounts[existing];
  accounts[name] = password;
  write(name, accounts);
}

// Stop remembering one account on this device.
export function removeLogin(username) {
  const { accounts } = read();
  const key = findKey(accounts, username);
  if (!key) return;
  delete accounts[key];
  const remaining = Object.keys(accounts);
  write(remaining[remaining.length - 1] || "", accounts);
}
