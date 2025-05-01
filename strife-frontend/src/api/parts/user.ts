import { BackendApi } from "@/api/base.ts";
import { AxiosError, AxiosResponse } from "axios";
import { Dayjs } from "dayjs";

export interface User {
    id: string;
    email: string;
    displayName: string;
    username: string;
    dateOfBirth: Date;
    avatarUrl: string;
    isTwoFAEnabled: boolean;
}

class UserApi extends BackendApi {
    constructor() {
        super('api/user');
    }

    async getProfile(): Promise<User> {
        const res: AxiosResponse = await this.backend.get('profile');
        return {
            ...res.data,
            dateOfBirth: new Date(res.data.dateOfBirth),
        };
    }

    async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await this.backend.post('avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }

            throw new Error('unknown_error');
        }
    }

    async removeAvatar(): Promise<{ avatarUrl: string }> {
        try {
            const res = await this.backend.delete('avatar');
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }

            throw new Error('unknown_error');
        }

    }

    async updateDisplayName(displayName: string): Promise<{ message: string }> {
        try {
            const res: AxiosResponse = await this.backend.put('display-name', { displayName });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }

            throw new Error('unknown_error');
        }
    }

    async updateEmail(email: string): Promise<{ message: string }> {
        try {
            const res: AxiosResponse = await this.backend.put('email', { email });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }

            throw new Error('unknown_error');
        }

    }

    async updateDateOfBirth(dateOfBirth: Dayjs | Date): Promise<{ message: string }> {
        try {
            const isoString = dateOfBirth instanceof Date ? dateOfBirth.toISOString() : dateOfBirth.toISOString();
            const res: AxiosResponse = await this.backend.put('date-of-birth', { dateOfBirth: isoString });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }

            throw new Error('unknown_error');
        }
    }

    async updateUsername(currentPassword: string, newUsername: string): Promise<{ message: string }> {
        try {
            const res: AxiosResponse = await this.backend.put('username', {
                currentPassword,
                newUsername,
            });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }

            throw new Error('unknown_error');
        }
    }

    async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
        try {
            const res: AxiosResponse = await this.backend.put('password', {
                currentPassword,
                newPassword,
            });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }
            throw new Error('unknown_error');
        }
    }

}

export const userApi: UserApi = new UserApi();