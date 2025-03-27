import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router";
import axios, { AxiosResponse } from "axios";

const API_URL: string = "http://localhost:3000/api";

interface User {
    id: string;
    email: string;
    displayName: string;
    username: string;
    dateOfBirth: Date;
}

export const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate: NavigateFunction = useNavigate();

    useEffect((): void => {
        const fetchProfile = async (): Promise<void> => {
            try {
                //response, logicno je tip AxiosResponse<User> a ne AxiosResponse<any> ili sl
                const response: AxiosResponse<User> = await axios.get(`${API_URL}/profile`, {
                    withCredentials: true
                });

                // dateOfBirth convertam prvo u validan Date objekat
                setUser({ ...response.data, dateOfBirth: new Date(response.data.dateOfBirth) });
            } catch (err: unknown) {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
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
            await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
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
