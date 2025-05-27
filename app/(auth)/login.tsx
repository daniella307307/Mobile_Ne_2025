import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import tw from 'twrnc';
import { router } from 'expo-router'; // Assuming you are using Expo Router
import { Ionicons } from '@expo/vector-icons'; // For icons

export default function LoginScreen() {
  const { login, error, loading, isAuthenticated, user } = useAuth(); // Added user

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = () => {
    // Basic client-side validation (optional, but good practice)
    if (!email.trim() || !password.trim()) {
      // useAuth hook should set its own error, but you can have an immediate client-side one too
      // setError("Email and password are required."); // If you had a local setError
      alert("Email and password are required."); // Simple alert for now
      return;
    }
    login(email, password);
  };


  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)'); // Or your main app screen path
    }
  }, [isAuthenticated]);

  // If already authenticated and redirecting, show a loading or welcome briefly
  if (isAuthenticated && user) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-100 px-6`}>
        <ActivityIndicator size="large" color={tw.color('teal-600')} />
        <Text style={tw`text-lg font-semibold text-gray-700 mt-4`}>
          Welcome back, {user.firstname}! Redirecting...
        </Text>
      </View>
    );
  }


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1`}
    >
      <View style={tw`flex-1 bg-gray-100 items-center justify-center px-6`}>
        {/* App Logo/Icon (Optional) */}
        <View style={tw`mb-10 items-center`}>
            <Ionicons name="wallet" size={64} color={tw.color('teal-500')} />
            <Text style={tw`text-3xl font-bold text-teal-600 mt-2`}>ExpenseTracker</Text>
            <Text style={tw`text-sm text-gray-500`}>Log in to manage your finances</Text>
        </View>

        {/* Email Input */}
        <View style={tw`w-full mb-4`}>
          <Text style={tw`text-xs font-medium text-gray-600 mb-1 ml-1`}>Email Address</Text>
          <TextInput
            style={tw`w-full h-12 bg-white rounded-lg px-4 text-sm border ${isEmailFocused ? 'border-teal-500 shadow-sm' : 'border-gray-300'} focus:border-teal-500`}
            placeholder="you@example.com"
            placeholderTextColor={tw.color('gray-400')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
          />
        </View>

        {/* Password Input */}
        <View style={tw`w-full mb-5`}>
          <Text style={tw`text-xs font-medium text-gray-600 mb-1 ml-1`}>Password</Text>
          <TextInput
            style={tw`w-full h-12 bg-white rounded-lg px-4 text-sm border ${isPasswordFocused ? 'border-teal-500 shadow-sm' : 'border-gray-300'} focus:border-teal-500`}
            placeholder="••••••••"
            placeholderTextColor={tw.color('gray-400')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
          />
        </View>


        {error ? <Text style={tw`text-red-500 mb-3 text-sm text-center`}>{error}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity
          style={tw`w-full bg-teal-500 py-3.5 rounded-lg items-center justify-center shadow-md active:bg-teal-600`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={tw.color('white')} />
          ) : (
            <Text style={tw`text-white text-base font-semibold`}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Alternative Actions */}
        <View style={tw`flex-row justify-center mt-6`}>
          <Text style={tw`text-sm text-gray-600`}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={tw`text-sm text-teal-600 font-semibold`}>Register</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => alert("Forgot Password clicked!")} style={tw`mt-3`}>
            <Text style={tw`text-xs text-gray-500`}>Forgot Password?</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}