import express from 'express';
import morgan from 'morgan';
import routes from './routes';

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

routes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
