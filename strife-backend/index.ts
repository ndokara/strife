import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import routes from './routes';
import authRoutes from './routes/auth';
import { connectDb } from './db/db';

const app = express();

connectDb();

const corsOptions = {
    origin: "http://localhost:5173",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies if using sessions
    allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

routes(app);


//rute
app.use('/api/', authRoutes);


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
