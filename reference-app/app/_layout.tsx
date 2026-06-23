import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/store/session";
import { colors } from "@/components/ui";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 5_000 },
    mutations: { retry: false },
  },
});

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTitleStyle: { color: colors.text },
  headerTintColor: colors.primary,
  contentStyle: { backgroundColor: colors.bg },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="light" />
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" options={{ title: "DOEH Rider" }} />
            <Stack.Screen name="deliveries" options={{ title: "My Deliveries" }} />
            <Stack.Screen name="delivery/[id]" options={{ title: "Delivery" }} />
            <Stack.Screen name="wallet" options={{ title: "Wallet" }} />
          </Stack>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
