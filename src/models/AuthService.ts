import { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { AuthenticationException, ValidationException } from './Exceptions';

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  landmark: string;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  landmark?: string;
  password: string;
}

export function mapSupabaseUserToProfile(user: User): AuthUserProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? '';
  const fallbackName = email.includes('@') ? email.split('@')[0] : 'Customer';

  return {
    id: user.id,
    email,
    fullName: typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : fallbackName,
    phone: typeof meta.phone === 'string' && meta.phone.trim() ? meta.phone.trim() : '+91 9876543210',
    address:
      typeof meta.address === 'string' && meta.address.trim()
        ? meta.address.trim()
        : 'Update your delivery address in profile',
    landmark: typeof meta.landmark === 'string' ? meta.landmark.trim() : '',
    emailConfirmed: Boolean(user.email_confirmed_at),
    createdAt: user.created_at,
  };
}

/**
 * OOP Authentication Service wrapping @supabase/supabase-js.
 * Validates inputs and translates Supabase auth failures into domain exceptions
 * (ValidationException and AuthenticationException).
 */
export class SupabaseAuthService {
  private readonly injectedClient?: SupabaseClient | null;

  constructor(client?: SupabaseClient | null) {
    this.injectedClient = client;
  }

  private requireClient(): SupabaseClient {
    const client = this.injectedClient !== undefined ? this.injectedClient : getSupabaseClient();
    if (!client) {
      throw new AuthenticationException(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local or configure them in the Sign In modal.',
      );
    }
    return client;
  }

  private validateEmail(email: string): string {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ValidationException('Please enter a valid email address.', { field: 'email' });
    }
    return trimmed;
  }

  public async getCurrentSession(): Promise<{
    session: Session | null;
    profile: AuthUserProfile | null;
  }> {
    const client = this.injectedClient !== undefined ? this.injectedClient : getSupabaseClient();
    if (!client) {
      return { session: null, profile: null };
    }
    try {
      const { data, error } = await client.auth.getSession();
      if (error) {
        throw new AuthenticationException(error.message);
      }
      return {
        session: data.session,
        profile: data.session?.user ? mapSupabaseUserToProfile(data.session.user) : null,
      };
    } catch {
      // Gracefully return empty session when offline or network disconnected
      return { session: null, profile: null };
    }
  }

  public subscribeAuthChanges(
    onChange: (profile: AuthUserProfile | null, session: Session | null) => void,
  ): () => void {
    const client = this.injectedClient !== undefined ? this.injectedClient : getSupabaseClient();
    if (!client) {
      return () => undefined;
    }
    try {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        try {
          onChange(session?.user ? mapSupabaseUserToProfile(session.user) : null, session);
        } catch {
          // Ignore background listener errors
        }
      });
      return () => {
        try {
          data.subscription.unsubscribe();
        } catch {
          // Ignore
        }
      };
    } catch {
      return () => undefined;
    }
  }

  public async signUp(input: SignUpInput): Promise<{
    profile: AuthUserProfile | null;
    needsEmailConfirmation: boolean;
  }> {
    const email = this.validateEmail(input.email);
    const fullName = input.fullName.trim();
    if (fullName.length < 2) {
      throw new ValidationException('Full name must be at least 2 characters long.');
    }
    const phoneDigits = input.phone.replace(/[\s\-+]/g, '');
    if (!/^\d{10,13}$/.test(phoneDigits)) {
      throw new ValidationException('Phone number must contain 10 to 13 digits.');
    }
    if (input.address.trim().length < 8) {
      throw new ValidationException('Delivery address must be at least 8 characters long.');
    }
    if (input.password.length < 6) {
      throw new ValidationException('Password must be at least 6 characters long.');
    }

    const client = this.requireClient();
    const { data, error } = await client.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          full_name: fullName,
          phone: input.phone.trim(),
          address: input.address.trim(),
          landmark: input.landmark?.trim() ?? '',
        },
      },
    });

    if (error) {
      // If email rate limit hit, provide a friendly message
      const msg = error.message.toLowerCase().includes('rate limit')
        ? 'Sign-up email limit reached. Please wait a few minutes and try again, or use a different email address.'
        : error.message;
      throw new AuthenticationException(msg, { code: error.code });
    }

    // Auto-confirm trigger fires immediately — session is always returned.
    return {
      profile: data.user ? mapSupabaseUserToProfile(data.user) : null,
      needsEmailConfirmation: false,
    };
  }

  public async signInWithPassword(emailInput: string, password: string): Promise<AuthUserProfile> {
    const email = this.validateEmail(emailInput);
    if (!password) {
      throw new ValidationException('Please enter your password.');
    }

    const client = this.requireClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw new AuthenticationException(error?.message || 'Unable to sign in with these credentials.');
    }

    return mapSupabaseUserToProfile(data.user);
  }

  public async sendMagicLink(emailInput: string): Promise<void> {
    const email = this.validateEmail(emailInput);
    const client = this.requireClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) {
      throw new AuthenticationException(error.message);
    }
  }

  public async sendPasswordReset(emailInput: string): Promise<void> {
    const email = this.validateEmail(emailInput);
    const client = this.requireClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    if (error) {
      throw new AuthenticationException(error.message);
    }
  }

  public async updateUserProfileMetadata(input: {
    fullName: string;
    phone: string;
    address: string;
    landmark?: string;
  }): Promise<AuthUserProfile | null> {
    const client = this.injectedClient !== undefined ? this.injectedClient : getSupabaseClient();
    if (!client) {
      return null;
    }
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return null;
    }

    const { data, error } = await client.auth.updateUser({
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        landmark: input.landmark?.trim() ?? '',
      },
    });

    if (error) {
      throw new AuthenticationException(error.message);
    }

    return data.user ? mapSupabaseUserToProfile(data.user) : null;
  }

  public async signOut(): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new AuthenticationException(error.message);
    }
  }
}

