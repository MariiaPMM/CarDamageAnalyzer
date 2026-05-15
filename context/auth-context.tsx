import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ACCOUNT_STORAGE_KEY = 'cardamageanalyzer.account';
const SESSION_STORAGE_KEY = 'cardamageanalyzer.session';

let memoryAccount: string | null = null;
let memorySession: string | null = null;

type StoredAccount = {
  name: string;
  email: string;
  password: string;
};

type Session = {
  name: string;
  email: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return key === ACCOUNT_STORAGE_KEY ? memoryAccount : memorySession;
  }
}

async function safeSetItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    if (key === ACCOUNT_STORAGE_KEY) {
      memoryAccount = value;
    } else {
      memorySession = value;
    }
  }
}

async function safeDeleteItem(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    if (key === ACCOUNT_STORAGE_KEY) {
      memoryAccount = null;
    } else {
      memorySession = null;
    }
  }
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await safeGetItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  await safeSetItem(key, JSON.stringify(value));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const storedSession = await readJson<Session>(SESSION_STORAGE_KEY);
        if (isMounted) {
          setSession(storedSession);
        }
      } catch {
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      async register(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const account: StoredAccount = {
          name: input.name.trim(),
          email: normalizedEmail,
          password: input.password,
        };
        const nextSession: Session = {
          name: account.name,
          email: account.email,
        };

        await writeJson(ACCOUNT_STORAGE_KEY, account);
        await writeJson(SESSION_STORAGE_KEY, nextSession);
        setSession(nextSession);
      },
      async login(input) {
        const account = await readJson<StoredAccount>(ACCOUNT_STORAGE_KEY);
        if (!account) {
          throw new Error('Акаунт ще не створено. Спочатку зареєструйся.');
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        if (account.email !== normalizedEmail || account.password !== input.password) {
          throw new Error('Невірний email або пароль.');
        }

        const nextSession: Session = {
          name: account.name,
          email: account.email,
        };

        await writeJson(SESSION_STORAGE_KEY, nextSession);
        setSession(nextSession);
      },
      async logout() {
        await safeDeleteItem(SESSION_STORAGE_KEY);
        setSession(null);
      },
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
