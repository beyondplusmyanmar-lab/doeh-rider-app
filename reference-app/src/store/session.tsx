import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

// The Sanctum bearer token is the only credential. It and the active shop_code
// live in the device secure store (iOS Keychain / Android Keystore) — never in
// plain AsyncStorage. The shop_code rides on every request as X-Shop-Code.
const K_TOKEN = "doeh.rider.token";
const K_SHOP = "doeh.rider.shopCode";
const K_NAME = "doeh.rider.name";

export interface Session {
  token: string;
  shopCode: string;
  riderName: string;
}

interface SessionState {
  session: Session | null;
  loaded: boolean;
  signIn: (s: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(K_TOKEN);
      const shopCode = await SecureStore.getItemAsync(K_SHOP);
      const riderName = await SecureStore.getItemAsync(K_NAME);
      if (token && shopCode) {
        setSession({ token, shopCode, riderName: riderName ?? "Rider" });
      }
      setLoaded(true);
    })();
  }, []);

  const signIn = async (s: Session) => {
    await SecureStore.setItemAsync(K_TOKEN, s.token);
    await SecureStore.setItemAsync(K_SHOP, s.shopCode);
    await SecureStore.setItemAsync(K_NAME, s.riderName);
    setSession(s);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(K_TOKEN);
    await SecureStore.deleteItemAsync(K_SHOP);
    await SecureStore.deleteItemAsync(K_NAME);
    setSession(null);
  };

  return <Ctx.Provider value={{ session, loaded, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
