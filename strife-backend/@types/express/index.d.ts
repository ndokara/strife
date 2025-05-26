// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as express from 'express';

import { IUser } from '../../models/user';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<IUser, 'id'>
    }

    interface AuthInfo {
      registerToken?: string;
    }
  }
}
