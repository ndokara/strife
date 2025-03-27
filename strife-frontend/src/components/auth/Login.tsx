import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import axios, { AxiosResponse } from "axios";

const API_URL: string = "http://localhost:3000/api";

interface LoginResponse {
    message: string;
}

export const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const navigate = useNavigate();

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            alert("Please enter both username and password.");
            return;
        }

        try {
            const response: AxiosResponse<LoginResponse> = await axios.post(
                `${API_URL}/login`,
                { username, password },
                { withCredentials: true }
            );

            if (response.status === 200) {
                alert("Login successful");
                navigate("/profile");
            }
        } catch (error) {
            alert("Login failed. Please check your credentials.");
        }
    }, [username, password, navigate]);

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button type="submit">Login</button>
        </form>
    );
};
