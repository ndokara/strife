import { BackendApi } from '@/api/base.ts';
import { AxiosError } from 'axios';

class TwoFAAPi extends BackendApi {
  constructor() {
    super('api/2fa');
  }

  async twoFASetup(): Promise<{ qrCode: string; secret: string }> {
    try {
      const res = await this.backend.post('2fa-setup');
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }

  async twoFASetupNew(email: string): Promise<{ qrCode: string; tempToken: string }> {
    try {
      const res = await this.backend.post('2fa-setup-new', { email });
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }

  async verifyTwoFASetup(token: string): Promise<{ message: string }> {
    try {
      const res = await this.backend.post('verify-2fa-setup', { token });
      return res.data;

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const apiError: { error?: string } = err.response?.data as { error?: string };
        throw new Error(apiError?.error || 'unknown_error');
      }

      throw new Error('unknown_error');
    }
  }

  async verifyTwoFASetupAndUpdate(secretToken: string, newToken: string): Promise<{ message: string }> {
    try {
      const res = await this.backend.put('verify-2fa-setup-and-update', { secretToken, newToken });
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
