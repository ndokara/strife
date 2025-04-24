import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { HttpHeader, HttpStatusCode, MediaType } from './http';

//Axios+interceptors

const authInterceptor = async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const token = localStorage.getItem('accessToken');

    if (token && config.withCredentials !== false) {
        config.headers.set(HttpHeader.Authorization, `Bearer ${token}`);
    }

    return config;
};

const responseInterceptor = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === HttpStatusCode.UNAUTHORIZED) {
            localStorage.removeItem('accessToken');
        }
        if (!error.response) {
            console.error('Network Error:', error);
        }
    }

    return Promise.reject(error);
};

export const createAxiosInstance = (basePath: string): AxiosInstance => {
    const instance = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_BASE_URL}/${basePath}`,
        headers: {
            [HttpHeader.ContentType]: MediaType.APPLICATION_JSON,
        },
        withCredentials: true,
    });

    instance.interceptors.request.use(authInterceptor);
    instance.interceptors.response.use(undefined, responseInterceptor);

    return instance;
};

export const isApiError = axios.isAxiosError;