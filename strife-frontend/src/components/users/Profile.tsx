import React, { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router";
import { userApi } from "@/api/parts/user.ts";
import { isApiError } from "@/api/core.ts";
import { authApi } from "@/api/parts/auth.ts";
import { HttpStatusCode } from "@/api/http.ts";


interface User {
    id: string;
    email: string;
    displayName: string;
    username: string;
    dateOfBirth: Date;
}

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate: NavigateFunction = useNavigate();

    useEffect(() => {
        const fetchProfile = async (): Promise<void> => {
            try {
                const user = await userApi.getProfile();
                setUser(user);
            } catch (err: unknown) {
                if (isApiError(err) && err.response?.status === HttpStatusCode.UNAUTHORIZED) {
                    setError("Unauthorized. Please log in.");
                } else {
                    setError("An unexpected error occurred.");
                }
                console.error("Error fetching profile:", err);
                navigate("/login");
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            setUser(null);
            navigate("/login");
        } catch (err: unknown) {
            console.error("Error logging out:", err);
            setError("Failed to log out. Please try again.");
        }
    };

    if (error) {
        return <div>{error}</div>;
    }
    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to your profile, {user.displayName}!</h1>
            <p>Email: {user.email}</p>
            <p>Username: {user.username}</p>
            <p>Date of Birth: {user.dateOfBirth.toDateString()}</p>
            <button onClick={handleLogout}>Log out</button>
        </div>
    );
};
export default Profile;
