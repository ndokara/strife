import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

interface JwtPayload {
    id: string;
}

export const createSecretToken = (id: string): string => {
    return jwt.sign({ id }, process.env.TOKEN_KEY as string, {
        expiresIn: 3 * 24 * 60 * 60, // 3 days
    });
};
