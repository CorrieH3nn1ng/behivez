export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  products?: string[];
  subscriptions?: SubscriptionInfo[];
}

export interface SubscriptionInfo {
  product: string;
  status: string;
  plan: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface AuthClientConfig {
  baseUrl: string;
  onTokenRefreshed?: (tokens: AuthTokens) => void;
  getStoredTokens?: () => AuthTokens | null;
}
