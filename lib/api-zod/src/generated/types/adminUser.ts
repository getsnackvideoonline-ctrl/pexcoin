export interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  status: string;
  usdtBalance: number;
  btcBalance: number;
  ethBalance: number;
  inviteCode: string;
  referredBy?: number | null;
  commissionEarned: number;
  createdAt: string;
}
