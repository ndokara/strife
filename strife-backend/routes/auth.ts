import express, {NextFunction, Request, Response} from 'express';
import bcrypt from "bcrypt";
import User, {IUser} from "../models/user";
import {createSecretToken} from '../middleware/generateToken';
import {AuthRequest, verifyToken} from "../middleware/verifyToken";

const router = express.Router();

interface RegisterRequestBody{
    email: string;
    displayName: string;
    username: string;
    password: string;
    dateOfBirth: string;
}

router.post('/register', async (req:Request, res:Response): Promise<any>=>{
    try {
        const {email, displayName, username, password, dateOfBirth} = req.body;
        const existingUser: IUser | null = await User.findOne({$or: [{email}, {username}]}).exec();
        if (existingUser) {
            return res.status(400).json({message: "Email or username already in use"});
        }
        const user: IUser = new User({email, displayName, username, password, dateOfBirth});
        await user.save();

        const token = createSecretToken(user.id.toString());

        res.cookie("token", token, {
            path: "/",
            expires: new Date(Date.now() + 86400000),
            secure: true,
            httpOnly: true,
        });

        console.log("cookie set succesfully");

        res.status(201).json({message: 'User registered successfully'});
    }
    catch (error){
        res.status(500).json({error: (error as Error).message});
    }
});

router.post('/login', async (req: Request, res:Response): Promise<any> =>{
    try{
        const {username, password} = req.body;
        const user = await User.findOne({username});

        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(400).json({message: "Invalid credentials."});
        }
        const token = createSecretToken(user.id);
        res.cookie("token", token, {
            domain: process.env.frontend_url,
            path: "/",
            expires: new Date(Date.now() + 86400000),
            secure: true,
            httpOnly: true,
        });

        res.json({message: "Login Successful."});
    }
    catch (error){
        res.status(500).json({error: (error as Error).message});
    }
});

router.post('/logout', (req: Request, res: Response, next: NextFunction): void =>{
    try{
        res.clearCookie('token');
        res.json({message: "Logged out successfully."});
    }
    catch (error){
        res.status(500).json({error: (error as Error).message});
    }
});

router.get('/profile', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(authReq.user.id).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});
export default router;