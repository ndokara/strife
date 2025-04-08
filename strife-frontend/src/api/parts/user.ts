import { BackendApi } from "@/api/base.ts";

export interface User {
    id: string;
    email: string;
    displayName: string;
    username: string;
    dateOfBirth: Date;
}

class UserApi extends BackendApi {
    constructor() {
        super('api/user');
    }

    async getProfile(): Promise<User> {
        const res = await this.backend.get('profile');
        return {
            ...res.data,
            dateOfBirth: new Date(res.data.dateOfBirth), // safe parsing
        };
    }
}

export const userApi = new UserApi();