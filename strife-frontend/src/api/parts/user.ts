import { BackendApi } from "@/api/base.ts";
import { AxiosError, AxiosResponse } from "axios";

export interface User {
    id: string;
    email: string;
    displayName: string;
    username: string;
    dateOfBirth: Date;
    avatarUrl: string;
    is2FAEnabled: boolean;
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
        const formData = new FormData();
        formData.append('avatar', file);

        const res: AxiosResponse = await this.backend.post('upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    }

    async removeAvatar(): Promise<{ avatarUrl: string }> {
        const res: AxiosResponse = await this.backend.put('remove-avatar');
        return res.data;
    }

    async updateDisplayName(displayName: string): Promise<{ message: string }> {
        const res: AxiosResponse = await this.backend.put('update-display-name', { displayName });
        return res.data;
    }

    async updateEmail(email: string): Promise<{ message: string }> {
        const res: AxiosResponse = await this.backend.put('update-email', { email });
        return res.data;
    }

    async updateDateOfBirth(dateOfBirth: string): Promise<{ message: string }> {
        const res: AxiosResponse = await this.backend.put('update-date-of-birth', { dateOfBirth });
        return res.data;
    }

    async updateUsername(currentPassword: string, newUsername: string): Promise<{ message: string }> {
        try {
            const res: AxiosResponse = await this.backend.put('update-username', {
                currentPassword,
                newUsername,
            });
            return res.data;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const apiError: { error?: string } = err.response?.data as { error?: string };
                throw new Error(apiError?.error || 'unknown_error');
            }

            throw new Error('unknown_error');
        }
    }
    async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
        try {
            const res: AxiosResponse = await this.backend.put('update-password', {
                currentPassword,
                newPassword,
            });
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

export const userApi: UserApi = new UserApi();