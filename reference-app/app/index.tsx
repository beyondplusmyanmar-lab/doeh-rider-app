import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { PREFILL_EMAIL, PREFILL_PASSWORD, RIDER_API_URL } from "@/config/env";
import { useSession } from "@/store/session";
import { login } from "@/api/client";
import { Body, Button, Card, Field, Muted, Pill, Screen, Title, colors } from "@/components/ui";

// Screen 1 — Login. Posts to /rider/login, stores the bearer token + the first
// shop's shop_code in the secure store, then routes to the deliveries list.
export default function Login() {
  const router = useRouter();
  const { session, loaded, signIn } = useSession();
  const [email, setEmail] = useState(PREFILL_EMAIL);
  const [password, setPassword] = useState(PREFILL_PASSWORD);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (token restored from secure store) → skip the form.
  useEffect(() => {
    if (loaded && session) router.replace("/deliveries");
  }, [loaded, session]);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      const membership = res.shops[0];
      if (!membership) throw new Error("This rider is not a member of any shop.");
      await signIn({
        token: res.token,
        shopCode: membership.shop.shop_code,
        riderName: res.rider.name,
      });
      router.replace("/deliveries");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <Screen>
        <Card>
          <Title>DOEH Rider — reference app</Title>
          <Muted>
            A conservative, fork-and-go example that consumes the first-party rider
            (fulfillment) API with a Sanctum token. No SDK, no API key.
          </Muted>
          <Body>
            Host: <Pill text={RIDER_API_URL.replace("https://", "")} tone="good" />
          </Body>
        </Card>

        <Card>
          <Title>Sign in</Title>
          <Field
            label="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="rider@sandbox.test"
          />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          {error ? <Body color={colors.bad}>{error}</Body> : null}
          <Button
            title="Sign in"
            onPress={onSubmit}
            loading={busy}
            disabled={!email || !password}
          />
          <Muted>
            The sandbox is preloaded with the published demo rider. A real shop points the
            host at its own domain and the rider uses their own account.
          </Muted>
        </Card>
      </Screen>
    </ScrollView>
  );
}
