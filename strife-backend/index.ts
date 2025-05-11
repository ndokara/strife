import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import passport from 'passport';
import { connectDb } from './db/db';
import routes from './routes';
import './middleware/passport/google';

dotenv.config();

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

// Passport session middleware (optional if using sessions)
app.use(passport.initialize());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
