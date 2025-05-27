// src/components/ExpenseDetailModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Expense } from '@/services/expenseService'; // Adjust path if your service is elsewhere

type ExpenseDetailModalProps = {
  visible: boolean;
  expense: Expense; // Expense can't be null if modal is visible
  onClose: () => void;
};

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  visible,
  expense,
  onClose,
}) => {
  const formattedDate = expense.createdAt
    ? new Date(expense.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const formattedTime = expense.createdAt
    ? new Date(expense.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose} // For Android back button
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close-circle" size={28} color={tw.color('gray-400')} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>{expense.title}</Text>

          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={22} color={tw.color('teal-600')} style={styles.icon} />
            <View>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>${Number(expense.amount).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={22} color={tw.color('teal-600')} style={styles.icon} />
            <View>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{expense.category}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={22} color={tw.color('teal-600')} style={styles.icon} />
            <View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
          </View>

          {formattedTime && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={22} color={tw.color('teal-600')} style={styles.icon} />
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{formattedTime}</Text>
              </View>
            </View>
          )}
          
          {expense.description && expense.description.trim() !== '' && (
            <View style={tw`mt-3 pt-3 border-t border-gray-200`}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <ScrollView style={{ maxHeight: 100 }}>
                <Text style={styles.descriptionText}>{expense.description}</Text>
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, tw`bg-teal-600 mt-6`]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: tw`flex-1 justify-center items-center bg-black bg-opacity-60`,
  modalView: tw`m-5 bg-white rounded-xl p-6 pt-8 shadow-xl w-11/12 max-w-md relative`,
  closeIcon: tw`absolute top-3 right-3 z-10`,
  modalTitle: tw`text-xl font-bold text-gray-800 mb-5 text-center`,
  detailItem: tw`flex-row items-start mb-3 p-2 bg-gray-50 rounded-md`,
  icon: tw`mr-3 mt-0.5`,
  detailLabel: tw`text-xs font-medium text-gray-500`,
  detailValue: tw`text-sm text-gray-700 font-medium`,
  descriptionLabel: tw`text-sm font-semibold text-gray-700 mb-1`,
  descriptionText: tw`text-sm text-gray-600 leading-relaxed`,
  button: tw`py-3 px-4 rounded-lg items-center`,
  buttonText: tw`text-white text-base font-semibold`,
});

export default ExpenseDetailModal;