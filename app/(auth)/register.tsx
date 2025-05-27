import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import InputField from "@/components/InputField";
import Button from "@/components/Button";

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
    username:"",
    confirmPassword: "",
  });

  const { register, loading } = useAuth();

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      username,
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
        console.log("Attempting registration with:", userData);
        await register(firstName, lastName, email, password, userData); // Updated signature
      } catch (error) {
        const err = error as Error;
        console.error("Registration error:", err);
        const errorMessage = err.message.includes("Network Error")
          ? "Network error: Please check your internet connection and try again."
          : err.message.includes("Email already exists")
          ? "This email is already registered. Please use a different email."
          : err.message || "An unexpected error occurred. Please try again.";
        Alert.alert("Registration Error", errorMessage);
      }
    } else {
      Alert.alert("Validation Error", "Please correct the errors in the form.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20} // Adjusted for Android
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled" // Ensures taps dismiss the keyboard
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start managing parking spaces
          </Text>
        </View>

        <View style={styles.formContainer}>
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

          <InputField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            error={errors.username}
            autoCapitalize="words"
          />

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
            autoCapitalize="none" // Prevents auto-capitalization on mobile
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            error={errors.password}
            autoCapitalize="none" // Prevents auto-capitalization on mobile
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
            autoCapitalize="none" // Prevents auto-capitalization on mobile
          />

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Register as:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "user" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("user")}
                accessibilityRole="button" // Improves accessibility on mobile
                accessibilityLabel="Register as user"
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "user" && styles.roleButtonTextActive,
                  ]}
                >
                  user
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "admin" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("admin")}
                accessibilityRole="button" // Improves accessibility on mobile
                accessibilityLabel="Register as Admin"
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "admin" && styles.roleButtonTextActive,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            disabled={loading} // Disable button during loading
            style={styles.registerButton}
          />

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 28,
    color: "#3071E8",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  roleButtonActive: {
    borderColor: "#3071E8",
    backgroundColor: "rgba(48, 113, 232, 0.1)",
  },
  roleButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  roleButtonTextActive: {
    color: "#3071E8",
  },
  registerButton: {
    marginTop: 8,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontFamily: "Inter-Regular",
    color: "#666",
  },
  loginText: {
    fontFamily: "Inter-Medium",
    color: "#3071E8",
  },
});
