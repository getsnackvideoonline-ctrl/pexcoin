export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  inviteCode: string;
}
