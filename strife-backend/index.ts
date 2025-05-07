import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import twoFARoutes from './routes/twofa';
import { connectDb } from './db/db';
import passport from 'passport';
import './middleware/passport/google';

const app = express();

connectDb();

const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization',
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));


routes(app);


//rute
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/2fa', twoFARoutes);

// Passport session middleware (optional if using sessions)
app.use(passport.initialize());


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
