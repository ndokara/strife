// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as express from 'express';

declare global {  namespace Express {
    interface User {
      id?: string;
    }
    interface AuthInfo {
      registerToken?: string;
    }
  }
}
