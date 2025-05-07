import { BackendApi } from '../base';
import { Dayjs } from 'dayjs';

export interface LoginResponse {
    accessToken: string;
    tempToken?: string;
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

  async register(email: string, displayName: string, username: string, password: string, dateOfBirth: Dayjs | null): Promise<RegisterResponse> {
    const res = await this.backend.post('register', { email, displayName, username, password, dateOfBirth });
    return res.data;
  }
  async completeRegistration(registerToken: string, dateOfBirth: Dayjs | Date): Promise<RegisterResponse> {
    const res = await this.backend.post('complete-registration', {registerToken, dateOfBirth});
    return res.data;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await this.backend.post('login', { username, password });
    return res.data;
  }

  async logout(): Promise<LogOutResponse> {
    const res = await this.backend.post('logout');
    return res.data;
  }
  async verify2FAOnLogin(code: string, tempToken: string): Promise<LoginResponse> {
    const res = await this.backend.post('verify-2fa-onlogin', {code, tempToken});
    return res.data;
  }
}

export const authApi = new AuthApi();
