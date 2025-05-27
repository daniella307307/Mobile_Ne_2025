import React, { JSX } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import tw from 'twrnc'; // Import twrnc
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Mail, Settings, HelpCircle, Bell, DollarSign } from 'lucide-react-native'; // Added DollarSign for budget
// Removed FontAwesome if lucide-react-native can cover all icons, or keep if specifically needed.
// For budget, lucide's DollarSign is a good fit.

export default function ProfileScreen({ navigation }: { navigation: any }) { // Added navigation prop for potential future use
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: logout, // This should handle navigation after logout too
          style: 'destructive',
        },
      ]
    );
  };

  if (!user) {
    // Optional: Show a loading state or a message if user data is being fetched
    // For now, returning null is fine if useAuth handles the loading state before rendering ProfileScreen
    return null;
  }

  // Fallback for initials if names are undefined/empty
  const firstNameInitial = user.firstname?.charAt(0)?.toUpperCase() || '';
  const lastNameInitial = user.lastname?.charAt(0)?.toUpperCase() || '';

  return (
    <ScrollView 
        style={tw`flex-1 bg-gray-100`} 
        contentContainerStyle={tw`pb-8 px-4 pt-6`} // Added more padding bottom
    >
      {/* Profile Header */}
      <View style={tw`items-center mb-8`}>
        <View style={tw`w-24 h-24 rounded-full bg-teal-500 justify-center items-center mb-4 shadow-md`}>
          <Text style={tw`text-4xl font-semibold text-white`}>
            {firstNameInitial}{lastNameInitial}
          </Text>
        </View>
        <Text style={tw`text-2xl font-bold text-gray-800`}>
          {user.firstname || 'User'} {user.lastname || ''}
        </Text>
        {/* You can add email here if desired, or keep it in the info card */}
        {/* <Text style={tw`text-sm text-gray-500`}>{user.email}</Text> */}
      </View>

      {/* Info Card */}
      <View style={tw`bg-white rounded-lg shadow-sm p-4 mb-8`}>
        <InfoRow 
          icon={<User size={20} color={tw.color('teal-600')} />} 
          label="Full Name" 
          value={`${user.firstname || ''} ${user.lastname || ''}`} 
        />
        <InfoRow 
          icon={<Mail size={20} color={tw.color('teal-600')} />} 
          label="Email" 
          value={user.email || 'N/A'} 
        />
        <InfoRow 
          icon={<DollarSign size={20} color={tw.color('teal-600')} />} 
          label="Monthly Budget" 
          value={user.budget !== undefined ? `$${Number(user.budget).toFixed(2)}` : 'Not Set'} 
          isLast={true} // To remove bottom border on the last item
        />
      </View>

      {/* Settings Section */}
      <View style={tw`mb-8`}>
        <Text style={tw`text-lg font-semibold text-gray-700 mb-3 px-1`}>Settings</Text>
        <MenuItem 
          icon={<Settings size={20} color={tw.color('gray-600')} />} 
          text="Account Settings" 
          onPress={() => Alert.alert("Account Settings", "Navigation to account settings.")} // Replace with actual navigation
        />
        <MenuItem 
          icon={<Bell size={20} color={tw.color('gray-600')} />} 
          text="Notifications" 
          onPress={() => Alert.alert("Notifications", "Navigation to notification settings.")} 
        />
        <MenuItem 
          icon={<HelpCircle size={20} color={tw.color('gray-600')} />} 
          text="Help & Support" 
          onPress={() => Alert.alert("Help & Support", "Navigation to help & support.")} 
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={tw`bg-red-500 py-3.5 rounded-lg items-center mb-6 shadow-sm`}
      >
        <View style={tw`flex-row items-center`}>
          <LogOut size={18} color={tw.color('white')} style={tw`mr-2`} />
          <Text style={tw`text-white text-base font-semibold`}>Logout</Text>
        </View>
      </TouchableOpacity>
      
      <Text style={tw`text-xs text-gray-400 text-center`}>
        Expense Tracker v1.0.0 😊
      </Text>
    </ScrollView>
  );
}

// Reusable InfoRow component
const InfoRow = ({ icon, label, value, isLast = false }: { icon: JSX.Element, label: string, value: string, isLast?: boolean }) => (
  <View style={tw`flex-row items-center py-3 ${!isLast ? 'border-b border-gray-200' : ''}`}>
    <View style={tw`w-10 h-10 rounded-full bg-teal-50 justify-center items-center mr-4`}>
      {icon}
    </View>
    <View style={tw`flex-1`}>
      <Text style={tw`text-xs text-gray-500 mb-0.5`}>{label}</Text>
      <Text style={tw`text-sm font-medium text-gray-800`}>{value}</Text>
    </View>
  </View>
);

// Reusable MenuItem component
const MenuItem = ({ icon, text, onPress }: { icon: JSX.Element, text: string, onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={tw`flex-row items-center bg-white rounded-lg p-3.5 mb-2 shadow-sm active:bg-gray-50`}
  >
    <View style={tw`w-9 h-9 rounded-full bg-gray-100 justify-center items-center mr-4`}>
      {icon}
    </View>
    <Text style={tw`flex-1 text-sm font-medium text-gray-700`}>{text}</Text>
    <Ionicons name="chevron-forward" size={18} color={tw.color('gray-400')} /> 
    {/* Assuming Ionicons is available globally or import it */}
  </TouchableOpacity>
);

// If Ionicons is not globally available, import it in this file:
import { Ionicons } from '@expo/vector-icons'; // Or your preferred icon library for chevron