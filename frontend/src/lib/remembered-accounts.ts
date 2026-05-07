import { AuthUser } from "@/services/auth.service";

const REMEMBERED_ACCOUNTS_KEY = "flux-remembered-accounts";
const REMEMBERED_ACCOUNTS_EVENT = "remembered-accounts-updated";
export const EMPTY_REMEMBERED_ACCOUNTS: RememberedAccount[] = [];

let cachedRawAccounts: string | null = null;
let cachedAccounts: RememberedAccount[] = EMPTY_REMEMBERED_ACCOUNTS;

export interface RememberedAccount {
  id: string;
  user: AuthUser;
  token: string;
  rememberedAt: string;
}

const getAccountId = (user: AuthUser) => user.id || user.email;

export const getRememberedAccounts = (): RememberedAccount[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(REMEMBERED_ACCOUNTS_KEY);
    if (!raw) {
      cachedRawAccounts = null;
      cachedAccounts = EMPTY_REMEMBERED_ACCOUNTS;
      return cachedAccounts;
    }

    if (raw === cachedRawAccounts) {
      return cachedAccounts;
    }

    cachedRawAccounts = raw;
    cachedAccounts = JSON.parse(raw);
    return cachedAccounts;
  } catch {
    localStorage.removeItem(REMEMBERED_ACCOUNTS_KEY);
    cachedRawAccounts = null;
    cachedAccounts = EMPTY_REMEMBERED_ACCOUNTS;
    return cachedAccounts;
  }
};

export const rememberAccount = (user: AuthUser, token: string) => {
  if (typeof window === "undefined") return;

  const id = getAccountId(user);
  const currentAccounts = getRememberedAccounts();
  const nextAccount: RememberedAccount = {
    id,
    user,
    token,
    rememberedAt: new Date().toISOString(),
  };

  const nextAccounts = [
    nextAccount,
    ...currentAccounts.filter((account) => account.id !== id),
  ];

  localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  cachedRawAccounts = JSON.stringify(nextAccounts);
  cachedAccounts = nextAccounts;
  window.dispatchEvent(new Event(REMEMBERED_ACCOUNTS_EVENT));
};

export const forgetRememberedAccount = (id: string) => {
  if (typeof window === "undefined") return;

  const nextAccounts = getRememberedAccounts().filter(
    (account) => account.id !== id,
  );

  localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  cachedRawAccounts = JSON.stringify(nextAccounts);
  cachedAccounts = nextAccounts;
  window.dispatchEvent(new Event(REMEMBERED_ACCOUNTS_EVENT));
};

export const subscribeToRememberedAccounts = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(REMEMBERED_ACCOUNTS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(REMEMBERED_ACCOUNTS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};
