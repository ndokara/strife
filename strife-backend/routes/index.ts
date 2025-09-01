import { Application } from 'express';
import auth from './auth';
import home from './home';
import twofa from './twofa';
import users from './users';
import guildtest from './guildtest';

export default function(app: Application) {
  app.use('/', home);
  app.use('/api/auth', auth);
  app.use('/api/user', users);
  app.use('/api/2fa', twofa);
  app.use('/api/guildtest', guildtest);
}
