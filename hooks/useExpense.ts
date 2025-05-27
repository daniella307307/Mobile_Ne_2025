// hooks/useExpense.ts
import { useEffect, useState } from 'react';
import { Expense, ExpenseService } from '../services/expenseService';

export const useExpenses = (ownerId: string, pageSize = 10) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadExpenses = async (isRefreshing = false) => {
    // Guard: Do not load if ownerId is not set
    if (!ownerId) {
      setExpenses([]); // Clear expenses if no ownerId
      setPage(1);
      setHasMore(false); // No more to load if no ownerId
      setLoading(false);
      return;
    }
    if (loading || (!hasMore && !isRefreshing)) return;

    setLoading(true);

    try {
      // If refreshing, use page 1, otherwise current page
      const currentPage = isRefreshing ? 1 : page;
      const newExpenses = await ExpenseService.getPaginatedByUser(ownerId, currentPage, pageSize);

      if (isRefreshing) {
        setExpenses(newExpenses);
      } else {
        setExpenses((prev) => [...prev, ...newExpenses]);
      }

      setHasMore(newExpenses.length === pageSize);
      setPage(currentPage + 1); // Increment page for next load
    } catch (error) {
      console.error('Failed to load expenses:', error);
      // Optionally, set an error state here to display to the user
    } finally {
      setLoading(false);
    }
  };

  const refreshExpenses = async () => {
    setExpenses([]); // Clear existing expenses
    setPage(1);       // Reset page to 1
    setHasMore(true); // Assume there's more data initially
    // setLoading(false); // Important: Let loadExpenses handle its loading state
    await loadExpenses(true); // Pass true to indicate it's a refresh
  };

  const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!ownerId) throw new Error("Cannot create expense without ownerId"); // Safety check
    const newExpense = await ExpenseService.create({...expense, ownerId }); // Ensure ownerId is set
    setExpenses((prev) => [newExpense, ...prev]); // Optimistic update
    // Optionally, call refreshExpenses() here if you want to ensure server state,
    // but optimistic update is usually fine.
    return newExpense; // Return the created expense for potential further use (like budget check)
  };

  const updateExpense = async (id: string, updatedFields: Partial<Expense>) => {
    const updated = await ExpenseService.update(id, updatedFields);
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updated } : exp)) // Ensure full update
    );
    return updated; // Return the updated expense
  };

  const deleteExpense = async (id: string) => {
    await ExpenseService.delete(id);
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    // No return value needed for delete, but could return true/false for success
  };

  const getExpenseById = async (id: string) => {
    return await ExpenseService.getById(id);
  };

  useEffect(() => {
    if (ownerId) { // Only refresh if ownerId is present
      refreshExpenses();
    } else {
      // Clear data if ownerId becomes null/empty (e.g., user logs out)
      setExpenses([]);
      setPage(1);
      setHasMore(true);
      setLoading(false);
    }
  }, [ownerId]); // Re-run when ownerId changes

  return {
    expenses,
    loading,
    hasMore,
    loadExpenses: () => loadExpenses(false), // Make sure to pass false for normal pagination
    refreshExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
  };
};