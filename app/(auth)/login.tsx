import React, { useState } from 'react';
import { View, TextInput, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import tw from 'twrnc';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { login, user, error, loading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    login(email, password);
  };

  if (isAuthenticated) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-100 px-6`}>
        <Text style={tw`text-xl font-semibold text-gray-800`}>
          Welcome, {user?.firstname}!
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-100 items-center justify-center px-6`}>
      <Text style={tw`text-3xl font-bold text-gray-800 mb-8`}>Login</Text>

      <TextInput
        style={tw`w-full h-12 bg-white rounded-xl px-4 text-base border border-gray-300 mb-4`}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={tw`w-full h-12 bg-white rounded-xl px-4 text-base border border-gray-300 mb-4`}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={tw`text-red-500 mb-2 text-center`}>{error}</Text> : null}

      <TouchableOpacity
        style={tw`w-full bg-blue-600 py-3 rounded-xl items-center mt-2`}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={tw`text-white text-base font-semibold`}>Login</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={()=>router.push('/(auth)/register')} style={tw`mt-4`}>
        <Text>Don't have an account ? Register</Text>
      </TouchableOpacity>
    </View>
  );
}
