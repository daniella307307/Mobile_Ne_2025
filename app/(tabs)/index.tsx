import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpense';
import { Expense } from '@/services/expenseService';
import { router } from 'expo-router'; // Ensure this is correctly imported
import ExpenseDetailModal from '../modal/expenseDetailsModal';

// Define a type for aggregated category data
type CategorySpending = {
  category: string;
  totalAmount: number;
  count: number;
  color: string;
};

// Helper for calculating category spending
const aggregateExpensesByCategory = (expenses: Expense[]): CategorySpending[] => {
  const categoryMap: { [key: string]: { totalAmount: number; count: number } } = {};
  expenses.forEach(expense => {
    if (!categoryMap[expense.category]) {
      categoryMap[expense.category] = { totalAmount: 0, count: 0 };
    }
    categoryMap[expense.category].totalAmount += Number(expense.amount);
    categoryMap[expense.category].count += 1;
  });

  const categoryColors = [
    tw.color('teal-500'),
    tw.color('cyan-500'),
    tw.color('emerald-500'),
    tw.color('sky-500'),
    tw.color('green-500'),
  ];

  return Object.entries(categoryMap)
    .map(([category, data], index) => ({
      category,
      ...data,
      color: categoryColors[index % categoryColors.length] || (tw.color('gray-400') as string),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

// Remove navigation prop from the component's props definition
// const DashboardScreen = ({ navigation }: { navigation: any }) => {
const DashboardScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ? String(user.id) : '';
  const { expenses, loading: expensesLoading } = useExpenses(userId);

  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleOpenExpenseModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseModalVisible(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalVisible(false);
    setSelectedExpense(null);
  };

  const totalSpent = useMemo(
    () => expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    [expenses]
  );

  const userBudget = user?.budget ?? 0;
  const budgetRemainingFormatted = useMemo(() => {
    if (userBudget > 0) {
      const remaining = userBudget - totalSpent;
      return `${remaining.toFixed(2)}RWF`;
    }
    return 'N/A';
  }, [userBudget, totalSpent]);

  const isOverBudget = useMemo(() => {
    return userBudget > 0 && totalSpent > userBudget;
  }, [userBudget, totalSpent]);

  const recentExpenses = useMemo(
    () => expenses.slice(0, 3),
    [expenses]
  );

  const categorySpending = useMemo(
    () => aggregateExpensesByCategory(expenses),
    [expenses]
  );

  const maxCategorySpent = useMemo(
    () => Math.max(...categorySpending.map(c => c.totalAmount), 0),
    [categorySpending]
  );

  if (authLoading || (expensesLoading && expenses.length === 0 && userId)) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color('teal-600')} />
        <Text style={tw`mt-4 text-teal-700`}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      <ScrollView contentContainerStyle={tw`p-4 pb-24 mt-12`}>
        <View style={tw`mb-6`}>
          <Text style={tw`text-2xl font-semibold text-gray-800`}>
            Hello, {user?.firstname || 'User'}!
          </Text>
          <Text style={tw`text-sm text-gray-600`}>
            Here's your financial overview.
          </Text>
        </View>

        <View style={tw`flex-row flex-wrap justify-between -mx-1.5 mb-2`}>
          <SummaryCard
            title="Total Spent"
            value={`${totalSpent.toFixed(2)}RWF`}
            iconName="wallet-outline"
            accentColorName="teal"
          />
          <SummaryCard
            title="Budget Remaining"
            value={budgetRemainingFormatted}
            iconName={isOverBudget ? "alert-circle-outline" : "checkmark-circle-outline"}
            accentColorName={budgetRemainingFormatted === 'N/A' ? 'gray' : (isOverBudget ? "red" : "green")}
          />
        </View>
        {(!userBudget || userBudget === 0) && (
             <TouchableOpacity
                style={tw`bg-white p-4 rounded-lg shadow-sm mb-4 items-center justify-center border border-teal-300 flex-row`}
                // Use router.push and pass params. Assuming analytics.tsx is at '/(tabs)/analytics'
                // and it can handle 'openSetBudgetModal' as a query parameter.
                onPress={() => router.push({
                  pathname: '/(tabs)/analytics', // Adjust if your path is different
                  params: { openSetBudgetModal: 'true' },
                })}
            >
                <Ionicons name="calculator-outline" size={22} color={tw.color('teal-600')} style={tw`mr-2`} />
                <Text style={tw`text-sm font-medium text-teal-600 text-center`}>Set Your Monthly Budget</Text>
             </TouchableOpacity>
        )}
         <SummaryCardFullWidth
            title="Expenses Logged"
            value={expenses.length.toString()}
            iconName="list-outline"
            accentColorName="cyan"
            style={tw`mb-5`}
          />

        {categorySpending.length > 0 && (
          <View style={tw`bg-white p-4 rounded-lg shadow-sm mb-5`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-3`}>
              Spending by Category
            </Text>
            {categorySpending.slice(0,4).map((item) => (
              <View key={item.category} style={tw`mb-2.5`}>
                <View style={tw`flex-row justify-between items-center mb-1`}>
                  <Text style={tw`text-xs font-medium text-gray-600`}>{item.category}</Text>
                  <Text style={tw`text-xs font-semibold text-teal-600`}>
                    {item.totalAmount.toFixed(2)}RWF
                  </Text>
                </View>
                <View style={tw`h-2 bg-gray-200 rounded-full overflow-hidden`}>
                  <View
                    style={[
                      tw`h-2 rounded-full`,
                      { backgroundColor: item.color, width: `${maxCategorySpent > 0 ? (item.totalAmount / maxCategorySpent) * 100 : 0}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
            {categorySpending.length > 4 && (
                // Use router.push. Assuming AnalyticsScreen is at '/analytics'
                <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')} /* Adjust path if needed */ >
                    <Text style={tw`text-xs text-teal-500 font-medium text-right mt-1.5`}>View All...</Text>
                </TouchableOpacity>
            )}
          </View>
        )}

        {recentExpenses.length > 0 && (
          <View style={tw`bg-white p-4 rounded-lg shadow-sm mb-5`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>
              Recent Transactions
            </Text>
            {recentExpenses.map((expense) => (
              <RecentExpenseItem
                key={expense.id}
                expense={expense}
                onPress={() => handleOpenExpenseModal(expense)}
              />
            ))}
             {expenses.length > recentExpenses.length && (
                 // Use router.push. Assuming analytics is at '/(tabs)/analytics'
                 <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')} /* Adjust path if needed */ >
                    <Text style={tw`text-xs text-teal-500 font-medium text-center mt-2`}>View All Expenses</Text>
                </TouchableOpacity>
             )}
          </View>
        )}

         {expenses.length === 0 && !expensesLoading && (
             <View style={tw`bg-white p-6 rounded-lg shadow-sm items-center justify-center my-5`}>
                <Ionicons name="receipt-outline" size={40} color={tw.color('teal-400')} />
                <Text style={tw`text-base font-semibold text-gray-700 mt-3`}>No Expenses Yet!</Text>
                <Text style={tw`text-xs text-gray-500 mt-1 text-center`}>Tap the '+' button to add your first expense.</Text>
             </View>
         )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/analytics')} // This was already correct
        style={tw`absolute bottom-5 right-5 bg-teal-600 p-3.5 rounded-full shadow-lg elevation-5`}
      >
        <Ionicons name="add" size={26} color="white" />
      </TouchableOpacity>

      {selectedExpense && (
        <ExpenseDetailModal
          visible={isExpenseModalVisible}
          expense={selectedExpense}
          onClose={handleCloseExpenseModal}
        />
      )}
    </SafeAreaView>
  );
};

// SummaryCard, SummaryCardFullWidth, RecentExpenseItem components remain the same

// Reusable Summary Card Component
const SummaryCard = ({ title, value, iconName, accentColorName }: {
  title: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColorName: 'teal' | 'green' | 'red' | 'cyan' | 'orange' | 'gray';
}) => {
  const accentColors = {
    teal:  { border: 'border-teal-500',  icon: tw.color('teal-500'),  textValue: 'text-teal-700' },
    green: { border: 'border-green-500', icon: tw.color('green-500'), textValue: 'text-green-700' },
    red:   { border: 'border-red-500',   icon: tw.color('red-500'),   textValue: 'text-red-700' },
    cyan:  { border: 'border-cyan-500',  icon: tw.color('cyan-500'),  textValue: 'text-cyan-700' },
    orange:{ border: 'border-orange-500',icon: tw.color('orange-500'),textValue: 'text-orange-700' },
    gray:  { border: 'border-gray-400',  icon: tw.color('gray-500'),  textValue: 'text-gray-700' },
  };
  const selectedAccent = accentColors[accentColorName] || accentColors.gray;

  return (
    <View style={[tw`w-[48%] bg-white p-3 rounded-lg shadow-sm mb-3 border-l-4`, tw`${selectedAccent.border}`]}>
      <View style={tw`flex-row items-center mb-0.5`}>
        <Ionicons name={iconName} size={18} color={selectedAccent.icon} style={tw`mr-1.5`} />
        <Text style={tw`text-xs font-medium text-gray-500`}>{title}</Text>
      </View>
      <Text style={[tw`text-xl font-bold`, tw`${selectedAccent.textValue}`]}>{value}</Text>
    </View>
  );
};

// Reusable Full Width Summary Card
const SummaryCardFullWidth = ({ title, value, iconName, accentColorName, style }: {
    title: string;
    value: string;
    iconName: keyof typeof Ionicons.glyphMap;
    accentColorName: 'teal' | 'green' | 'red' | 'cyan' | 'orange' | 'gray';
    style?: any;
  }) => {
    const accentColors = {
        teal:  { border: 'border-teal-500',  icon: tw.color('teal-500'),  textValue: 'text-teal-700' },
        green: { border: 'border-green-500', icon: tw.color('green-500'), textValue: 'text-green-700' },
        red:   { border: 'border-red-500',   icon: tw.color('red-500'),   textValue: 'text-red-700' },
        cyan:  { border: 'border-cyan-500',  icon: tw.color('cyan-500'),  textValue: 'text-cyan-700' },
        orange:{ border: 'border-orange-500',icon: tw.color('orange-500'),textValue: 'text-orange-700' },
        gray:  { border: 'border-gray-400',  icon: tw.color('gray-500'),  textValue: 'text-gray-700' },
    };
    const selectedAccent = accentColors[accentColorName] || accentColors.gray;

    return (
      <View style={[tw`bg-white p-3 rounded-lg shadow-sm border-l-4`, tw`${selectedAccent.border}`, style]}>
        <View style={tw`flex-row items-center mb-0.5`}>
          <Ionicons name={iconName} size={18} color={selectedAccent.icon} style={tw`mr-1.5`} />
          <Text style={tw`text-xs font-medium text-gray-500`}>{title}</Text>
        </View>
        <Text style={[tw`text-xl font-bold`, tw`${selectedAccent.textValue}`]}>{value}</Text>
      </View>
    );
};


// Reusable Recent Expense Item Component
const RecentExpenseItem = ({ expense, onPress }: { expense: Expense; onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={tw`flex-row justify-between items-center py-2.5 border-b border-gray-100 last:border-b-0`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={tw`text-sm font-medium text-gray-700`}>{expense.title}</Text>
          <Text style={tw`text-xs text-gray-500`}>
            {expense.category} - {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <Text style={tw`text-sm font-semibold text-teal-600`}>
          {Number(expense.amount).toFixed(2)}RWF
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default DashboardScreen;