import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/store/session";
import { advanceStatus, getDelivery, markCodCollected } from "@/api/client";
import { Status, formatMinor, isTerminal, nextRiderAction } from "@/domain/delivery";
import { Body, Button, Card, Muted, Pill, Screen, Title, colors } from "@/components/ui";

// Screen 3 — Delivery detail + the lifecycle actions (accept → pickup →
// delivered → COD). The primary button is whatever single transition the rider
// is allowed next; reaching "Delivered" on a COD order auto-collects the cash.
export default function DeliveryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deliveryId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();
  const { session } = useSession();
  const token = session!.token;
  const shop = session!.shopCode;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["delivery", deliveryId],
    queryFn: () => getDelivery(token, shop, deliveryId),
  });
  const d = q.data;

  // Run an action, then refresh the detail, the list, and the wallet so any
  // COD movement is visible immediately.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["delivery", deliveryId] }),
        qc.invalidateQueries({ queryKey: ["deliveries"] }),
        qc.invalidateQueries({ queryKey: ["wallet"] }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!d) {
    return (
      <Screen>
        <Muted>{error ?? "Loading…"}</Muted>
      </Screen>
    );
  }

  const action = nextRiderAction(d.status);
  const canCollectCod = d.status === Status.Delivered && d.is_cod && !d.cod_collected;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <Screen>
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Title>{d.delivery_code}</Title>
            <Pill text={d.status_label} tone={isTerminal(d.status) ? "muted" : "warn"} />
          </View>
          <Muted>Order {d.order_number ?? "—"}</Muted>
          <Body>{d.drop_address ?? "No drop address"}</Body>
          {d.is_cod ? (
            <Body color={d.cod_collected ? colors.good : colors.text}>
              {"COD " +
                formatMinor(d.cod_amount_minor, "MMK") +
                (d.cod_collected ? " — collected" : "")}
            </Body>
          ) : (
            <Muted>Not a COD order</Muted>
          )}
        </Card>

        <Card>
          <Title>Next step</Title>
          {error ? <Body color={colors.bad}>{error}</Body> : null}
          {action ? (
            <Button
              title={action.label}
              loading={busy}
              onPress={() => run(() => advanceStatus(token, shop, deliveryId, action.status))}
            />
          ) : (
            <Muted>This delivery is in a terminal state ({d.status_label}).</Muted>
          )}
          {canCollectCod ? (
            <Button
              title="Collect COD"
              variant="ghost"
              loading={busy}
              onPress={() => run(() => markCodCollected(token, shop, deliveryId))}
            />
          ) : null}
          <Muted>
            Marking a COD delivery “Delivered” auto-collects the cash into your wallet — the
            explicit Collect COD action is only a fallback for deliveries closed shop-side.
          </Muted>
        </Card>

        <Button title="Back to deliveries" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </ScrollView>
  );
}
