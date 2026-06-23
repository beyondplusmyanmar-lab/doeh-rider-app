import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/store/session";
import { getWallet, listDeliveries } from "@/api/client";
import { formatMinor, isTerminal } from "@/domain/delivery";
import { Body, Button, Card, Muted, Pill, Screen, Title, colors } from "@/components/ui";

// Screen 2 — My deliveries. Lists the rider's active (non-terminal) deliveries
// for the token's shop, with a wallet summary at the top. Tap a row to advance it.
export default function Deliveries() {
  const router = useRouter();
  const { session, signOut } = useSession();
  const token = session!.token;
  const shop = session!.shopCode;

  const deliveries = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => listDeliveries(token, shop),
  });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getWallet(token, shop) });
  const currency = wallet.data?.currency ?? "MMK";

  return (
    <Screen>
      <Card>
        <Title>Wallet</Title>
        {wallet.data ? (
          <Body>
            Balance:{" "}
            <Pill text={formatMinor(wallet.data.balance_minor, currency)} tone="good" />
          </Body>
        ) : (
          <Muted>Loading…</Muted>
        )}
        <Button title="Wallet detail" variant="ghost" onPress={() => router.push("/wallet")} />
      </Card>

      <FlatList
        data={deliveries.data ?? []}
        keyExtractor={(d) => String(d.id)}
        refreshControl={
          <RefreshControl
            refreshing={deliveries.isFetching}
            onRefresh={() => deliveries.refetch()}
            tintColor={colors.text}
          />
        }
        ListHeaderComponent={<Title>My deliveries</Title>}
        ListEmptyComponent={
          !deliveries.isLoading ? <Muted>No active deliveries.</Muted> : null
        }
        contentContainerStyle={{ gap: 12, paddingVertical: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/delivery/${item.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Body>{item.delivery_code}</Body>
                <Pill
                  text={item.status_label}
                  tone={isTerminal(item.status) ? "muted" : "warn"}
                />
              </View>
              <Muted>
                {(item.order_number ?? "—") + " · " + (item.drop_address ?? "no address")}
              </Muted>
              {item.is_cod ? (
                <Body color={item.cod_collected ? colors.good : colors.text}>
                  {"COD " +
                    formatMinor(item.cod_amount_minor, currency) +
                    (item.cod_collected ? " (collected)" : "")}
                </Body>
              ) : (
                <Muted>Not a COD order</Muted>
              )}
            </Card>
          </Pressable>
        )}
      />

      <Button
        title="Sign out"
        variant="ghost"
        onPress={() => signOut().then(() => router.replace("/"))}
      />
    </Screen>
  );
}
