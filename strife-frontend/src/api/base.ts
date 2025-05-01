import { AxiosInstance } from 'axios';
import { createAxiosInstance } from './core';

// abstract api class
export abstract class BackendApi {
  protected readonly backend: AxiosInstance;

  constructor(subpath: string) {
    this.backend = createAxiosInstance(subpath);
  }
}
