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
  Alert,
  Keyboard,
} from 'react-native';
import tw from 'twrnc';
import { useExpenses } from '@/hooks/useExpense';
// AsyncStorage is not directly used in this component anymore for user ID
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '@/services/expenseService';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useRoute } from '@react-navigation/native'; // For handling route params

const BUDGET_WARNING_THRESHOLD = 0.8; // 80%

// Define route param types
type HistoryRouteParams = {
  openAddModal?: boolean;
  openSetBudgetModal?: boolean;
};
type HistoryScreenRouteProp = RouteProp<{ History: HistoryRouteParams }, 'History'>;


const History = () => {
  const route = useRoute<HistoryScreenRouteProp>();
  const { user, updateProfile, loading: authLoading } = useAuth();
  const userId = user?.id ? String(user.id) : '';

  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
  });

  const [budgetInputModalVisible, setBudgetInputModalVisible] = useState(false);
  const [budgetInputValue, setBudgetInputValue] = useState<string>('');

  const {
    expenses,
    loading: expensesLoading,
    hasMore,
    loadExpenses,
    refreshExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses(userId);

  // Effect to handle route params for opening modals
  useEffect(() => {
    if (route.params?.openAddModal) {
      setNewExpense({ title: '', amount: '', category: '', description: '' });
      setEditingExpenseId(null);
      setAddExpenseModalVisible(true);
      // Reset param to avoid re-triggering (optional, depends on navigation setup)
      // navigation.setParams({ openAddModal: undefined });
    }
    if (route.params?.openSetBudgetModal) {
      setBudgetInputModalVisible(true);
      // navigation.setParams({ openSetBudgetModal: undefined });
    }
  }, [route.params]);


  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const userBudget = user?.budget ?? 0;
  const remainingBudget = userBudget - totalSpent;

  const checkBudgetNotification = (currentTotalSpent: number) => {
    if (userBudget <= 0) return; // Don't notify if no budget is set

    if (currentTotalSpent >= userBudget * BUDGET_WARNING_THRESHOLD) {
      if (currentTotalSpent >= userBudget) {
        Alert.alert(
          'Budget Exceeded',
          `You have spent ${currentTotalSpent.toFixed(2)}RWF and exceeded your budget of ${userBudget.toFixed(2)}RWF.`
        );
      } else {
        Alert.alert(
          'Budget Warning',
          `You have spent ${currentTotalSpent.toFixed(2)}RWF which is ${((currentTotalSpent / userBudget) * 100).toFixed(0)}% of your budget (${userBudget.toFixed(2)}RWF).`
        );
      }
    }
  };

  // Removed initial budget check on load, notifications are now tied to actions
  // useEffect(() => { ... }, [totalSpent, userBudget, expenses.length]);

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
    };

    Keyboard.dismiss();
    let success = false;
    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, expenseData);
      } else {
        const created = await createExpense(expenseData as Omit<Expense, 'id' | 'createdAt'>);
        const newTotalSpent = totalSpent + created.amount;
        checkBudgetNotification(newTotalSpent);
      }
      success = true;
    } catch (error) {
      console.error("Failed to save expense:", error);
      Alert.alert("Error", "Could not save expense. " + ((error as Error).message || "Unknown error"));
    }

    if (success) {
      setNewExpense({ title: '', amount: '', category: '', description: '' });
      setEditingExpenseId(null);
      setAddExpenseModalVisible(false);
      // Optimistic update should handle list refresh.
      // refreshExpenses(); // Uncomment if strict server refresh needed
    }
  };

  const openModalForEdit = (expense: Expense) => {
    setNewExpense({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '', // Ensure description is not undefined
    });
    setEditingExpenseId(expense.id ?? null);
    setAddExpenseModalVisible(true);
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
      Alert.alert('Invalid Budget', 'Please enter a valid non-negative number for your budget.');
      return;
    }
    Keyboard.dismiss();
    try {
      await updateProfile({ budget: newBudgetValue });
      Alert.alert('Budget Updated', `Your new budget is ${newBudgetValue.toFixed(2)}RWF`);
      setBudgetInputModalVisible(false);
      // budgetInputValue is pre-filled, no need to clear here unless desired.
      checkBudgetNotification(totalSpent); // Check with current totalSpent and new budget
    } catch (error) {
      console.error('Failed to update budget:', error);
      Alert.alert('Error', 'Could not update budget. ' + ((error as Error).message || "Unknown error"));
    }
  };

  useEffect(() => {
    if (budgetInputModalVisible && user?.budget !== undefined) {
        setBudgetInputValue(String(user.budget));
    } else if (budgetInputModalVisible) {
        setBudgetInputValue('0'); // Default to 0 if no budget set yet
    }
  }, [user?.budget, budgetInputModalVisible]);


  if (authLoading || (!userId && expensesLoading && expenses.length === 0 && userId)) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color('teal-600')} />
        <Text style={tw`mt-4 text-teal-700`}>Loading data...</Text>
      </SafeAreaView>
    );
  }

  if (!userId && !authLoading) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-100 p-5`}>
        <Ionicons name="log-in-outline" size={48} color={tw.color('teal-500')} />
        <Text style={tw`text-lg text-gray-700 mt-4 text-center`}>Please log in to manage your expenses.</Text>
        {/* Optionally add a login button here that navigates to login screen */}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100 mt-8`}>
      {/* Budget Display and Set Button */}
      <View style={tw`p-4 border-b border-gray-200 bg-white shadow-sm`}>
        <View style={tw`flex-row justify-between items-center mb-1.5`}>
          <Text style={tw`text-base font-semibold text-gray-700`}>
            Monthly Budget: 
            <Text style={tw`text-teal-600`}> {userBudget.toFixed(2)}RWF</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setBudgetInputModalVisible(true)}
            style={tw`bg-teal-100 px-3 py-1.5 rounded-md active:bg-teal-200`}
          >
            <Text style={tw`text-teal-700 text-xs font-medium`}>Set Budget</Text>
          </TouchableOpacity>
        </View>
        <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-sm text-gray-600`}>Spent: {totalSpent.toFixed(2)}RWF</Text>
            <Text style={tw`text-sm font-medium ${remainingBudget < 0 ? 'text-red-500' : 'text-green-600'}`}>
            Remaining: {remainingBudget.toFixed(2)} RWF
            </Text>
        </View>
        {userBudget > 0 && totalSpent > userBudget && (
            <Text style={tw`text-xs text-red-500 mt-1`}>You are over budget!</Text>
        )}
      </View>

      <FlatList
        contentContainerStyle={tw`p-4`}
        data={expenses}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={({ item }) => (
          <View style={tw`bg-white p-3.5 rounded-lg shadow-sm mb-3`}>
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`flex-1 mr-2`}>
                    <Text style={tw`text-base font-semibold text-gray-800`}>{item.title}</Text>
                    {item.description ? <Text style={tw`text-xs text-gray-500 mt-0.5`}>{item.description}</Text> : null}
                </View>
                <Text style={tw`text-base font-bold text-teal-600`}>{Number(item.amount).toFixed(2)}RWF</Text>
            </View>
            <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100`}>
                <View>
                    <Text style={tw`text-xs text-gray-500`}>Category: {item.category}</Text>
                    <Text style={tw`text-xs text-gray-400`}>
                    Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
                <View style={tw`flex-row`}>
                <TouchableOpacity
                    onPress={() => openModalForEdit(item)}
                    style={tw`bg-yellow-400 p-2 rounded-md mr-2 active:bg-yellow-500`}
                >
                    <Ionicons name="pencil" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDeleteExpense(item.id)}
                    style={tw`bg-red-500 p-2 rounded-md active:bg-red-600`}
                >
                    <Ionicons name="trash-bin" size={16} color="white" />
                </TouchableOpacity>
                </View>
            </View>
          </View>
        )}
        onRefresh={refreshExpenses}
        refreshing={expensesLoading}
        onEndReached={() => {
          if (hasMore && !expensesLoading) loadExpenses();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={expensesLoading && expenses.length > 0 ? <ActivityIndicator style={tw`my-4`} size="small" color={tw.color('teal-500')} /> : null}
        ListEmptyComponent={!expensesLoading && expenses.length === 0 && userId ? (
            <View style={tw`flex-1 justify-center items-center mt-20`}>
                <Ionicons name="receipt-outline" size={48} color={tw.color('teal-400')} />
                <Text style={tw`text-gray-600 text-lg mt-3`}>No expenses found.</Text>
                <Text style={tw`text-gray-400 text-sm`}>Tap the '+' button to add your first one!</Text>
            </View>
        ) : null}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => {
          setNewExpense({ title: '', amount: '', category: '', description: '' });
          setEditingExpenseId(null);
          setAddExpenseModalVisible(true);
        }}
        style={tw`absolute bottom-5 right-5 bg-teal-600 p-3.5 rounded-full shadow-lg elevation-5`}
      >
        <Ionicons name="add" size={26} color="white" />
      </TouchableOpacity>

      {/* Modal for Create/Edit Expense */}
      <Modal visible={addExpenseModalVisible} animationType="slide" transparent onRequestClose={() => setAddExpenseModalVisible(false)}>
        <TouchableOpacity 
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-60`}
            activeOpacity={1} 
            onPressOut={() => { Keyboard.dismiss(); setAddExpenseModalVisible(false);}} // Dismiss modal on outside tap
        >
            <TouchableOpacity activeOpacity={1} style={tw`w-11/12 bg-white p-5 rounded-lg shadow-xl max-w-md`}> {/* Prevent content tap from closing */}
                <Text style={tw`text-lg font-semibold mb-4 text-gray-800 text-center`}>
                {editingExpenseId ? 'Edit Expense' : 'Add New Expense'}
                </Text>

                <TextInput
                placeholder="Title (e.g., Groceries)"
                value={newExpense.title}
                onChangeText={(text) => setNewExpense((prev) => ({ ...prev, title: text }))}
                style={tw`border border-gray-300 px-3.5 py-2.5 rounded-md mb-3 text-sm bg-gray-50 focus:border-teal-500`}
                />
                <TextInput
                placeholder="Amount (e.g., 25.50)"
                keyboardType="numeric"
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense((prev) => ({ ...prev, amount: text }))}
                style={tw`border border-gray-300 px-3.5 py-2.5 rounded-md mb-3 text-sm bg-gray-50 focus:border-teal-500`}
                />
                <TextInput
                placeholder="Category (e.g., Food)"
                value={newExpense.category}
                onChangeText={(text) => setNewExpense((prev) => ({ ...prev, category: text }))}
                style={tw`border border-gray-300 px-3.5 py-2.5 rounded-md mb-3 text-sm bg-gray-50 focus:border-teal-500`}
                />
                <TextInput
                placeholder="Description (Optional)"
                value={newExpense.description}
                onChangeText={(text) => setNewExpense((prev) => ({ ...prev, description: text }))}
                style={tw`border border-gray-300 px-3.5 py-2.5 rounded-md mb-4 text-sm bg-gray-50 focus:border-teal-500 h-20`}
                multiline
                textAlignVertical="top"
                />

                <View style={tw`flex-row justify-end mt-2`}>
                <TouchableOpacity
                    onPress={() => {
                    setAddExpenseModalVisible(false);
                    setNewExpense({ title: '', amount: '', category: '', description: '' });
                    setEditingExpenseId(null);
                    }}
                    style={tw`px-4 py-2.5 rounded-md mr-2 bg-gray-100 active:bg-gray-200`}
                >
                    <Text style={tw`text-gray-700 font-medium text-sm`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSaveExpense}
                    style={tw`bg-teal-500 px-5 py-2.5 rounded-md shadow-sm active:bg-teal-600`}
                >
                    <Text style={tw`text-white font-semibold text-sm`}>
                    {editingExpenseId ? 'Update' : 'Add Expense'}
                    </Text>
                </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Setting Budget */}
      <Modal visible={budgetInputModalVisible} animationType="slide" transparent onRequestClose={() => setBudgetInputModalVisible(false)}>
        <TouchableOpacity 
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-60`}
            activeOpacity={1} 
            onPressOut={() => { Keyboard.dismiss(); setBudgetInputModalVisible(false);}}
        >
            <TouchableOpacity activeOpacity={1} style={tw`w-10/12 bg-white p-5 rounded-lg shadow-xl max-w-sm`}>
                <Text style={tw`text-lg font-semibold mb-4 text-gray-800 text-center`}>Set Your Monthly Budget</Text>
                <TextInput
                placeholder="Enter total budget amount"
                keyboardType="numeric"
                value={budgetInputValue}
                onChangeText={setBudgetInputValue}
                style={tw`border border-gray-300 px-3.5 py-2.5 rounded-md mb-4 text-sm bg-gray-50 focus:border-teal-500`}
                />
                <View style={tw`flex-row justify-end mt-2`}>
                <TouchableOpacity
                    onPress={() => {
                        setBudgetInputModalVisible(false);
                    }}
                    style={tw`px-4 py-2.5 rounded-md mr-2 bg-gray-100 active:bg-gray-200`}
                >
                    <Text style={tw`text-gray-700 font-medium text-sm`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSetBudget}
                    style={tw`bg-green-500 px-5 py-2.5 rounded-md shadow-sm active:bg-green-600`}
                >
                    <Text style={tw`text-white font-semibold text-sm`}>Set Budget</Text>
                </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default History;