import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const MAX_SIZE: number = 1024 * 1024;
const allowedTypes = ['image/jpeg', 'image/png'];

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG files are allowed.'));
    }
};

const storage: multer.StorageEngine = multer.memoryStorage();

const uploadAvatar: multer.Multer = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter,
});

export default uploadAvatar;