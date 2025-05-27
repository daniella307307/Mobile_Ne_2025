import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  FlatList,
  Text,
  ActivityIndicator,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert, // Import Alert
  Keyboard,
} from 'react-native';
import tw from 'twrnc';
import { useExpenses } from '@/hooks/useExpense';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '@/services/expenseService';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

const BUDGET_WARNING_THRESHOLD = 0.8; // 80%

const History = () => {
  // const [userId, setUserId] = useState<string>(''); // We'll get userId from useAuth
  const { user, updateProfile, loading: authLoading } = useAuth(); // Use auth hook
  const userId = user?.id ? String(user.id) : '';

  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
  });

  // Budget related state
  const [budgetInputModalVisible, setBudgetInputModalVisible] = useState(false);
  const [budgetInputValue, setBudgetInputValue] = useState<string>('');

  // This effect is no longer needed as userId comes from useAuth
  // useEffect(() => {
  //   const loadUser = async () => {
  //     try {
  //       const userString = await AsyncStorage.getItem('user');
  //       const localUser = userString ? JSON.parse(userString) : null;
  //       if (localUser?.id) setUserId(String(localUser.id));
  //       else console.error('User ID not found from AsyncStorage');
  //     } catch (error) {
  //       console.error('Failed to load user from AsyncStorage:', error);
  //     }
  //   };
  //   if (!user?.id) { // Fallback if useAuth is slow or fails for id
  //     loadUser();
  //   }
  // }, [user?.id]);

  const {
    expenses,
    loading: expensesLoading,
    hasMore,
    loadExpenses,
    refreshExpenses, // Get refreshExpenses
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses(userId); // Pass userId from auth

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const userBudget = user?.budget ?? 0;
  const remainingBudget = userBudget - totalSpent;

  const checkBudgetNotification = (currentTotalSpent: number) => {
    if (userBudget > 0 && currentTotalSpent >= userBudget * BUDGET_WARNING_THRESHOLD) {
      if (currentTotalSpent >= userBudget) {
        Alert.alert(
          'Budget Exceeded',
          `You have spent $${currentTotalSpent.toFixed(2)} and exceeded your budget of $${userBudget.toFixed(2)}.`
        );
      } else {
        Alert.alert(
          'Budget Warning',
          `You have spent $${currentTotalSpent.toFixed(2)} which is ${((currentTotalSpent / userBudget) * 100).toFixed(0)}% of your budget ($${userBudget.toFixed(2)}).`
        );
      }
    }
  };

  useEffect(() => {
    // Initial budget check when expenses load or budget changes
    if (expenses.length > 0 && userBudget > 0) {
        // Delay slightly to ensure user sees the page before an alert pops up
        // setTimeout(() => checkBudgetNotification(totalSpent), 1000);
        // Or only check after a new expense, not on load. This is probably better.
    }
  }, [totalSpent, userBudget, expenses.length]);


  const handleSaveExpense = async () => {
    if (!newExpense.title || !newExpense.amount || !newExpense.category) {
      Alert.alert("Missing fields", "Please fill in Title, Amount, and Category.");
      return;
    }
    const amountValue = parseFloat(newExpense.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }

    const expenseData = {
      ...newExpense,
      amount: amountValue,
      // ownerId: userId, // ownerId is now handled by createExpense in the hook
    };

    Keyboard.dismiss();
    let success = false;
    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, expenseData);
      } else {
        const created = await createExpense(expenseData as Omit<Expense, 'id' | 'createdAt'>);
        // After creating an expense, check budget
        // The `expenses` state in `useExpenses` is updated optimistically,
        // so `totalSpent` will recalculate. We need to ensure `totalSpent` for checkBudgetNotification
        // reflects the new expense.
        // A more robust way is to pass the new total directly or re-fetch total.
        // Since `totalSpent` is derived from `expenses` which is updated by `createExpense`,
        // we can call checkBudgetNotification after the state updates.
        // However, state updates might not be immediate.
        // Let's recalculate for the check:
        const newTotalSpent = totalSpent + created.amount; // If createExpense returns the new expense
        checkBudgetNotification(newTotalSpent);

      }
      success = true;
    } catch (error) {
      console.error("Failed to save expense:", error);
      Alert.alert("Error", "Could not save expense. " + (error as Error).message);
    }

    if (success) {
      setNewExpense({ title: '', amount: '', category: '', description: '' });
      setEditingExpenseId(null);
      setModalVisible(false);
      // refreshExpenses(); // Call refreshExpenses after add/edit to get fresh list from server
      // The optimistic update in useExpenses should already update the list.
      // Uncomment above if you strictly need server-refreshed data immediately.
    }
  };

  const openModalForEdit = (expense: Expense) => {
    setNewExpense({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description,
    });
    setEditingExpenseId(expense.id ?? null);
    setModalVisible(true);
  };

  const handleDeleteExpense = async (expenseId: string | undefined) => {
    if (!expenseId) return;
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              // Optionally refresh or rely on optimistic update
              // refreshExpenses();
              // Budget check after delete is less common, but you could:
              // const newTotalSpent = totalSpent - (expenses.find(e => e.id === expenseId)?.amount || 0);
              // checkBudgetNotification(newTotalSpent);
            } catch (error) {
              console.error("Failed to delete expense:", error);
              Alert.alert("Error", "Could not delete expense.");
            }
          },
        },
      ]
    );
  };

  const handleSetBudget = async () => {
    const newBudgetValue = parseFloat(budgetInputValue);
    if (isNaN(newBudgetValue) || newBudgetValue < 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid positive number for your budget.');
      return;
    }
    Keyboard.dismiss();
    try {
      await updateProfile({ budget: newBudgetValue });
      Alert.alert('Budget Updated', `Your new budget is $${newBudgetValue.toFixed(2)}`);
      setBudgetInputModalVisible(false);
      setBudgetInputValue(''); // Clear input
      // Check budget immediately with new budget value
      checkBudgetNotification(totalSpent);
    } catch (error) {
      console.error('Failed to update budget:', error);
      Alert.alert('Error', 'Could not update budget. ' + (error as Error).message);
    }
  };

  useEffect(() => {
    // Pre-fill budget input when user data is available and modal opens
    if (user?.budget !== undefined) {
        setBudgetInputValue(String(user.budget));
    }
  }, [user?.budget, budgetInputModalVisible]);


  if (authLoading || (!userId && expensesLoading)) { // Show loading if auth or initial expenses are loading
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center mt-20`}>
        <ActivityIndicator size="large" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  if (!userId && !authLoading) { // If auth has loaded but no userId (e.g. not logged in)
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center`}>
        <Text>Please log in to view your expenses.</Text>
        {/* Optionally add a login button here */}
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={tw`flex-1 bg-white `}>
      {/* Budget Display and Set Button */}
      <View style={tw`p-4 border-b border-gray-200 mt-8`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={tw`text-lg font-semibold`}>
            Budget: ${userBudget.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={() => setBudgetInputModalVisible(true)}
            style={tw`bg-green-500 px-3 py-1 rounded`}
          >
            <Text style={tw`text-white`}>Set Budget</Text>
          </TouchableOpacity>
        </View>
        <Text style={tw`text-md`}>Total Spent: ${totalSpent.toFixed(2)}</Text>
        <Text style={tw`text-md ${remainingBudget < 0 ? 'text-red-500' : 'text-green-600'}`}>
          Remaining: ${remainingBudget.toFixed(2)}
        </Text>
        {userBudget > 0 && totalSpent > userBudget && (
            <Text style={tw`text-sm text-red-600 mt-1`}>You are over budget!</Text>
        )}
      </View>

      <FlatList
        contentContainerStyle={tw`p-4`}
        data={expenses}
        keyExtractor={(item) => item.id ?? Math.random().toString()} // Fallback for key if id is somehow missing
        renderItem={({ item }) => (
          <View style={tw`p-4 mb-3 bg-gray-100 rounded shadow`}>
            <Text style={tw`text-lg font-bold`}>{item.title}</Text>
            {item.description ? <Text style={tw`text-gray-700`}>{item.description}</Text> : null}
            <Text style={tw`text-gray-800`}>Amount: ${Number(item.amount).toFixed(2)}</Text>
            <Text style={tw`text-gray-800`}>Category: {item.category}</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>
              Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
            </Text>

            <View style={tw`flex-row mt-3 pt-2 border-t border-gray-200`}>
              <TouchableOpacity
                onPress={() => openModalForEdit(item)}
                style={tw`bg-yellow-400 px-4 py-2 rounded mr-2 flex-1 items-center`}
              >
                <Text style={tw`text-white font-semibold`}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteExpense(item.id)}
                style={tw`bg-red-500 px-4 py-2 rounded flex-1 items-center`}
              >
                <Text style={tw`text-white font-semibold`}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        onRefresh={refreshExpenses} // Add pull-to-refresh
        refreshing={expensesLoading} // Show loading indicator on pull-to-refresh
        onEndReached={() => {
          if (hasMore && !expensesLoading) loadExpenses();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={expensesLoading && expenses.length > 0 ? <ActivityIndicator style={tw`my-4`} size="small" /> : null}
        ListEmptyComponent={!expensesLoading && expenses.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center mt-10`}>
                <Text style={tw`text-gray-500 text-lg`}>No expenses found.</Text>
                <Text style={tw`text-gray-400`}>Tap the '+' button to add your first expense!</Text>
            </View>
        ) : null}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => {
          setNewExpense({ title: '', amount: '', category: '', description: '' });
          setEditingExpenseId(null);
          setModalVisible(true);
        }}
        style={tw`absolute bottom-6 right-6 bg-blue-500 p-4 rounded-full shadow-lg elevation-5`}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal for Create/Edit Expense */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity 
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
            activeOpacity={1} 
            onPressOut={Keyboard.dismiss} // Dismiss keyboard when tapping outside modal content
        >
          <View style={tw`w-11/12 bg-white p-6 rounded-lg shadow-xl`}>
            <Text style={tw`text-xl font-bold mb-4 text-center`}>
              {editingExpenseId ? 'Edit Expense' : 'New Expense'}
            </Text>

            <TextInput
              placeholder="Title (e.g., Groceries, Dinner)"
              value={newExpense.title}
              onChangeText={(text) => setNewExpense((prev) => ({ ...prev, title: text }))}
              style={tw`border border-gray-300 px-3 py-2 rounded mb-3 text-base`}
            />
            <TextInput
              placeholder="Amount (e.g., 25.50)"
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense((prev) => ({ ...prev, amount: text }))}
              style={tw`border border-gray-300 px-3 py-2 rounded mb-3 text-base`}
            />
            <TextInput
              placeholder="Category (e.g., Food, Transport)"
              value={newExpense.category}
              onChangeText={(text) => setNewExpense((prev) => ({ ...prev, category: text }))}
              style={tw`border border-gray-300 px-3 py-2 rounded mb-3 text-base`}
            />
            <TextInput
              placeholder="Description (Optional)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense((prev) => ({ ...prev, description: text }))}
              style={tw`border border-gray-300 px-3 py-2 rounded mb-4 text-base`}
              multiline
            />

            <View style={tw`flex-row justify-end mt-2`}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewExpense({ title: '', amount: '', category: '', description: '' });
                  setEditingExpenseId(null);
                }}
                style={tw`px-4 py-2 rounded mr-3`}
              >
                <Text style={tw`text-gray-600 font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveExpense}
                style={tw`bg-blue-500 px-6 py-3 rounded shadow`}
              >
                <Text style={tw`text-white font-bold`}>
                  {editingExpenseId ? 'Update' : 'Add Expense'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Setting Budget */}
      <Modal visible={budgetInputModalVisible} animationType="slide" transparent>
        <TouchableOpacity 
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
            activeOpacity={1} 
            onPressOut={Keyboard.dismiss}
        >
          <View style={tw`w-10/12 bg-white p-6 rounded-lg shadow-xl`}>
            <Text style={tw`text-xl font-bold mb-4 text-center`}>Set Your Budget</Text>
            <TextInput
              placeholder="Enter total budget amount"
              keyboardType="numeric"
              value={budgetInputValue}
              onChangeText={setBudgetInputValue}
              style={tw`border border-gray-300 px-3 py-2 rounded mb-4 text-base`}
            />
            <View style={tw`flex-row justify-end mt-2`}>
              <TouchableOpacity
                onPress={() => {
                    setBudgetInputModalVisible(false);
                    // setBudgetInputValue(String(user?.budget || '')); // Reset to current budget if cancelled
                }}
                style={tw`px-4 py-2 rounded mr-3`}
              >
                <Text style={tw`text-gray-600 font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSetBudget}
                style={tw`bg-green-500 px-6 py-3 rounded shadow`}
              >
                <Text style={tw`text-white font-bold`}>Set Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default History;