// types.ts
export interface Expense {
  id?: string;
  createdAt?: string;
  title: string;
  description: string;
  amount: number;
  ownerId: string;
  category: string;
}
export interface User {
  id: string;
  createdAt?: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string; // Note: In real apps, passwords are hashed!
  budget: number;
}