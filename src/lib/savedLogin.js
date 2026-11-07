// Credentials remembered on this device, so the login form can prefill them.
// Kept in one small module so the login flow stays stable across other edits.
const KEY = "saved_login_accounts";
const LEGACY_KEY = "saved_login";

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

// The credentials used most recently on this device.
export function getLastLogin() {
  const { lastUsername, accounts } = read();
  if (!lastUsername) return null;
  return { username: lastUsername, password: accounts[lastUsername] || "" };
}

// Password saved earlier for a specific username ("" when unknown).
export function getSavedPassword(username) {
  if (!username) return "";
  return read().accounts[username] || "";
}

// Remember these credentials and mark them as the last used.
export function saveLogin(username, password) {
  if (!username || !password) return;
  const { accounts } = read();
  accounts[username] = password;
  try {
    localStorage.setItem(KEY, JSON.stringify({ lastUsername: username, accounts }));
  } catch (_) { /* storage full or blocked */ }
}
