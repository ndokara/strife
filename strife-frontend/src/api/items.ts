import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export interface Item {
  id: number;
  name: string;
  description: string;
}

export async function create(item: Partial<Item>): Promise<Item> {
  return (await axios.post(API_URL, item)).data;
}

export async function getAll(): Promise<Item[]> {
  return axios.get(`${API_URL}/items`);
}

export async function getById(id: number): Promise<Item> {
  return await axios.get(`${API_URL}/items/${id}`);
}
