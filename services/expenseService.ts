import axios from 'axios';

const BASE_URL = 'https://68355da3cd78db2058c11959.mockapi.io/api/v1'; // Replace with your actual URL

export interface Expense {
  id?: string;
  createdAt?: string;
  title: string;
  description: string;
  amount: number;
  ownerId: string;
  category: string;
}

export const ExpenseService = {
  // Get all expenses
  async getAll(): Promise<Expense[]> {
    const response = await axios.get(`${BASE_URL}/expenses`);
    return response.data;
  },

  // Get a single expense by ID
  async getById(id: string): Promise<Expense> {
    const response = await axios.get(`${BASE_URL}/expenses/${id}`);
    return response.data;
  },

  // Create a new expense
  async create(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const response = await axios.post(`${BASE_URL}/expenses`, expense);
    return response.data;
  },

  // Update an existing expense
  async update(id: string, expense: Partial<Expense>): Promise<Expense> {
    const response = await axios.put(`${BASE_URL}/expenses/${id}`, expense);
    return response.data;
  },
  async getPaginatedByUser(ownerId: string, page = 1, limit = 10): Promise<Expense[]> {
    const response = await axios.get(`${BASE_URL}/expenses`, {
      params: {
        ownerId,
        page,
        limit,
      },
    });
    return response.data;
  },
  // Delete an expense
  async delete(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/expenses/${id}`);
  },
};
