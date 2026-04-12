import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface OrderItem {
  id: number;
  symbol: string;
  side: string;
  type: string;
  amount: number;
  price: number | null;
  status: string;
  filledAmount: number;
  avgPrice: number | null;
  total: number | null;
  createdAt: string;
}

export interface PlaceOrderInput {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  amount: number;
  price?: number | null;
  total?: number | null;
}

export interface CoinBalance {
  symbol: string;
  amount: number;
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlaceOrderInput) =>
      customFetch<OrderItem>("/api/orders", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/balances"] });
    },
  });
}

export function useGetMyOrders() {
  return useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => customFetch<OrderItem[]>("/api/orders"),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) =>
      customFetch<{ success: boolean }>(`/api/orders/${orderId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/balances"] });
    },
  });
}

export function useGetCoinBalances() {
  return useQuery({
    queryKey: ["/api/orders/balances"],
    queryFn: () => customFetch<CoinBalance[]>("/api/orders/balances"),
  });
}
