import { Application } from 'express';

import home from './home';

export default function(app: Application) {
  app.use('/', home);
}
