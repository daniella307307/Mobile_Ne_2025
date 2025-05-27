import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useExpenses } from '@/hooks/useExpense';
import tw from 'twrnc';
import { Expense } from '../services/expenseService';

const ownerId = 'user-123'; // Replace with dynamic user ID if needed

const ExpensesScreen = () => {
  const {
    expenses,
    loading,
    hasMore,
    loadExpenses,
    createExpense,
    deleteExpense,
  } = useExpenses(ownerId);

  const handleAddExpense = async () => {
    const newExpense = {
      title: 'Test Expense',
      description: 'Generated from UI',
      amount: Math.floor(Math.random() * 100),
      ownerId,
      category: 'Other',
    };
    await createExpense(newExpense);
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={tw`bg-white p-4 mb-2 rounded-lg shadow`}>
      <Text style={tw`text-lg font-bold`}>{item.title}</Text>
      <Text>{item.description}</Text>
      <Text style={tw`text-blue-500`}>${item.amount}</Text>
      <TouchableOpacity
        onPress={() => deleteExpense(item.id!)}
        style={tw`bg-red-500 p-2 rounded mt-2 w-24`}
      >
        <Text style={tw`text-white text-center`}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-100 p-4`}>
      <TouchableOpacity
        style={tw`bg-green-600 p-3 rounded mb-4`}
        onPress={handleAddExpense}
      >
        <Text style={tw`text-white text-center text-lg`}>Add Expense</Text>
      </TouchableOpacity>

      {loading && expenses.length === 0 ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id!}
          renderItem={renderItem}
          onEndReached={loadExpenses}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator style={tw`mt-2`} /> : null
          }
        />
      )}
    </View>
  );
};

export default ExpensesScreen;
