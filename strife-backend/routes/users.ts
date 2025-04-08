import { AuthRequest, verifyToken } from "../middleware/verifyToken";
import { NextFunction, Request, Response } from "express";
import User from "../models/user";
import router from "./auth";

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
export default router