import React, { useState } from "react";
import {
  View,
  Text,
  // StyleSheet, // Will be replaced by twrnc
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator, // For Button loading state
  TextInput, // For InputField placeholder
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import tw from "twrnc"; // Import twrnc
import { Ionicons } from '@expo/vector-icons'; // For header icon

// --- Re-using Placeholder Components with twrnc styling from previous examples ---
// You should adapt these to your actual InputField and Button components
// or replace them with direct TextInput/TouchableOpacity if your components are not flexible.

const InputField = ({ label, value, onChangeText, placeholder, error, secureTextEntry, keyboardType, autoCapitalize }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={tw`w-full mb-4`}>
      {label && <Text style={tw`text-xs font-medium text-gray-600 mb-1 ml-1`}>{label}</Text>}
      <TextInput // Using TextInput directly for styling consistency
        style={tw`w-full h-12 bg-white rounded-lg px-4 text-sm border ${
          isFocused ? 'border-teal-500 shadow-sm' : 'border-gray-300'
        } focus:border-teal-500`}
        placeholder={placeholder}
        placeholderTextColor={tw.color('gray-400')}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || "none"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error ? <Text style={tw`text-xs text-red-500 mt-1 ml-1`}>{error}</Text> : null}
    </View>
  );
};

const Button = ({ title, onPress, loading, disabled, style, textStyle }: any) => (
  <TouchableOpacity
    style={[
      tw`w-full bg-teal-500 py-3.5 rounded-lg items-center justify-center shadow-md active:bg-teal-600`,
      (disabled || loading) && tw`bg-teal-300`, // Style for disabled state
      style, // Allow custom styles to be passed
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={tw.color('white')} />
    ) : (
      <Text style={[tw`text-white text-base font-semibold`, textStyle]}>{title}</Text>
    )}
  </TouchableOpacity>
);
// --- End of Placeholder Components ---


export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    username:"", // Keeping username error
    confirmPassword: "",
  });

  const { register, loading, error: authError } = useAuth(); // Capture authError

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      username: "", // Keeping username error
      confirmPassword: "",
    };

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      valid = false;
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
      valid = false;
    }
    // Validation for username - kept as per original code
    if (!username.trim()) {
        newErrors.username = "Username is required";
        valid = false;
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }
    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        
        const userData = {
          firstname: firstName, 
          lastname: lastName,
          email,
          password,
          username, 
          budget: 0,
        };
        
        await register(firstName, lastName, email, password, userData);
      } catch (error) { // This catch is fine, works with authError from hook
        const err = error as Error;
        console.error("Registration error in component:", err);
        const errorMessage = err.message.includes("Network Error")
          ? "Network error: Please check your internet connection and try again."
          : err.message.includes("Email already exists") || err.message.includes("Email already in use")
          ? "This email is already registered. Please use a different email."
          : err.message || "An unexpected error occurred. Please try again.";
        Alert.alert("Registration Error", errorMessage);
      }
    } else {
      // Inline errors are displayed by InputField, no separate Alert needed
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-gray-100`} // Main container background
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20} // Keep if needed
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center px-6 py-8`} // ScrollView styling
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`items-center mb-8`}> {/* Header container */}
          <Ionicons name="person-add-outline" size={56} color={tw.color('teal-500')} />
          <Text style={tw`text-2xl font-bold text-teal-600 mt-3`}>Create Account</Text>
          <Text style={tw`text-sm text-gray-500 mt-1 text-center`}>
            {/* Subtitle updated for expense tracker context, but can be generic */}
            Sign up to start tracking your expenses!
          </Text>
        </View>

        <View style={tw`w-full`}> {/* Form container */}
          <InputField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            error={errors.firstName}
            autoCapitalize="words"
          />
          <InputField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            error={errors.lastName}
            autoCapitalize="words"
          />
          <InputField // Username field kept
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            error={errors.username}
            autoCapitalize="none"
          />
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
            autoCapitalize="none"
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password (min. 6 chars)"
            secureTextEntry
            error={errors.password}
            autoCapitalize="none"
          />
          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
            autoCapitalize="none"
          />
          {authError && <Text style={tw`text-sm text-red-500 mb-3 text-center`}>{authError}</Text>}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            // style={tw`mt-1`} // Button already has some top margin due to last InputField's mb-4
          />

          <View style={tw`flex-row justify-center mt-6 items-center`}> {/* Footer container */}
            <Text style={tw`text-sm text-gray-600`}>Already have an account? </Text>
            {/* Using router.replace for consistency if Link caused issues */}
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={tw`text-sm text-teal-600 font-semibold`}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}