import { BackendApi } from '@/api/base.ts';
import { AxiosError } from 'axios';

export interface twoFASetupResponse{
  qrCode: string;
  secret: string;
  tempToken: string;
}

class TwoFAAPi extends BackendApi {
  constructor() {
    super('api/2fa');
  }

  async twoFASetup(email?: string): Promise<twoFASetupResponse> {
    try {
      const res = await this.backend.post('2fa-setup', {email});
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }

  async verifyTwoFASetup(token: string, tempToken: string): Promise<{ message: string }> {
    try {
      const res = await this.backend.post('verify-2fa-setup', { token, tempToken});
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }

  async verifyTwoFAToken(token: string): Promise<{ message: string }> {
    try {
      const res = await this.backend.post('verify-2fa', { token });
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }

  async removeTwoFA(password: string): Promise<{ message: string }> {
    try {
      const res = await this.backend.post('remove-2fa', { password });
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }
}

export const twoFAApi = new TwoFAAPi();
