import { BackendApi } from '../base';
import { Dayjs } from 'dayjs';

export interface LoginResponse {
  accessToken: string;
  twoFARequired: boolean;
}

export interface RegisterResponse {
  message: string;
  accessToken: string;
}

interface CheckCredentialsResponse {
  emailExists: boolean;
  usernameExists: boolean;
}

interface LogOutResponse {
  message: string;
}

class AuthApi extends BackendApi {
  constructor() {
    // I can add subpath here if needed
    super('api/auth');
  }

  async checkCredentials(email: string, username: string): Promise<CheckCredentialsResponse> {
    const res = await this.backend.post('check-existing-credentials', { email, username });
    return res.data;
  }

  async register(email: string, displayName: string, username: string, dateOfBirth: Dayjs | null, googleId?: string, avatarUrl?: string, password?: string): Promise<RegisterResponse> {
    const res = await this.backend.post('register', { email, displayName, username, password, dateOfBirth, googleId, avatarUrl});
    return res.data;
  }

  async completeRegistration(registerToken: string, dateOfBirth: Dayjs | Date): Promise<RegisterResponse> {
    const res = await this.backend.post('complete-registration', { registerToken, dateOfBirth });
    return res.data;
  }

  async login(username: string, password: string, code: string): Promise<LoginResponse> {
    const res = await this.backend.post('login', { username, password, code});
    return res.data;
  }

  async logout(): Promise<LogOutResponse> {
    const res = await this.backend.post('logout');
    return res.data;
  }

  async verify2FAOnLogin(code: string, tempToken: string): Promise<LoginResponse> {
    const res = await this.backend.post('verify-2fa-onlogin', { code, tempToken });
    return res.data;
  }
  async google(googleToken: any): Promise<any>{
    const res = await this.backend.post('/google', JSON.stringify({ googleToken }), {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  }
}

export const authApi = new AuthApi();
