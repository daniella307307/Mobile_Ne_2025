import axios from "axios";
import { User } from "./types"; // or define inline if needed

const API_URL = "https://68355da3cd78db2058c11959.mockapi.io/api/v1";

export const AuthService = {
  async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const response = await axios.get(`${API_URL}/users`);
    const users: User[] = response.data;

    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const token = `mock-token-${Date.now()}-${user.id}`;
    return { user, token };
  },

  async register(
    data: Omit<User, "id" | "createdAt">
  ): Promise<{ user: User; token: string }> {
    const response = await axios.get(`${API_URL}/users`);
    const users: User[] = response.data;

    if (users.find((u) => u.email === data.email)) {
      throw new Error("Email already in use");
    }

    const newUser = {
      ...data,
      budget: data.budget || 0,
      createdAt: new Date().toISOString(),
    };

    const registerResponse = await axios.post(`${API_URL}/users`, newUser);
    const user: User = registerResponse.data;

    const token = `mock-token-${Date.now()}-${user.id}`;
    return { user, token };
  },
  async updateUser(
    id: string,
    updates: Partial<Omit<User, "id">>
  ): Promise<User> {
    const response = await axios.put(`${API_URL}/users/${id}`, updates);
    return response.data;
  },
  async getUserById(id: string): Promise<User> {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  },
};
