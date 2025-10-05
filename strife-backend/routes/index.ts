import { Application } from 'express';
import auth from './auth';
import home from './home';
import twofa from './twofa';
import users from './users';
import guild from './guild';
import channel from './channel';
import role from './role';
import member from './member';

export default function(app: Application) {
  app.use('/', home);
  app.use('/api/auth', auth);
  app.use('/api/user', users);
  app.use('/api/2fa', twofa);
  app.use('/api/guild', guild);
  app.use('/api/channel', channel);
  app.use('/api/role', role);
  app.use('/api/member', member);
}
