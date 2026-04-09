export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  createdAt: string;
  inviteCode: string;
  referredBy?: number | null;
  commissionEarned: number;
}
