import React from "react";
import { ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/store/session";
import { getUnreadCount, getWallet } from "@/api/client";
import { formatMinor } from "@/domain/delivery";
import { Body, Card, Muted, Pill, Screen, Title, colors } from "@/components/ui";

// Screen 4 — Wallet. The rider's COD balances plus an unread-notification count.
export default function WalletScreen() {
  const { session } = useSession();
  const token = session!.token;
  const shop = session!.shopCode;

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getWallet(token, shop) });
  const unread = useQuery({ queryKey: ["unread"], queryFn: () => getUnreadCount(token, shop) });

  const w = wallet.data;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <Screen>
        <Card>
          <Title>COD wallet</Title>
          {w ? (
            <>
              <Body>
                Balance: <Pill text={formatMinor(w.balance_minor, w.currency)} tone="good" />
              </Body>
              <Muted>Total collected: {formatMinor(w.total_collected_minor, w.currency)}</Muted>
              {typeof w.total_settled_minor === "number" ? (
                <Muted>Total settled: {formatMinor(w.total_settled_minor, w.currency)}</Muted>
              ) : null}
              {typeof w.total_refunded_minor === "number" ? (
                <Muted>Total refunded: {formatMinor(w.total_refunded_minor, w.currency)}</Muted>
              ) : null}
            </>
          ) : (
            <Muted>Loading…</Muted>
          )}
        </Card>

        <Card>
          <Title>Notifications</Title>
          <Body>{unread.data ? `${unread.data.unread_count} unread` : "—"}</Body>
          <Muted>
            Money on this contract is integer minor units (*_minor). MMK is zero-decimal, so
            the minor value equals the displayed amount.
          </Muted>
        </Card>
      </Screen>
    </ScrollView>
  );
}
