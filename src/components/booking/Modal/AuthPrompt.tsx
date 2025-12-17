import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  Phone,
} from "@mui/icons-material";
import {
  useLoginMutation,
  useGetPermissionsQuery,
} from "@/lib/redux/features/auth/authApi";
import Cookies from "js-cookie";
import { useQuickRegisterMutation } from "@/lib/redux/features/auth/authApi";
import { useAuth } from "@/lib/hooks/useAuth";
import type { BookingData } from "@/lib/types";

type BookingFormData = BookingData;

interface AuthPromptProps {
  onContinueAsGuest: () => void;
  onAuthenticated: (user: {
    userId: string;
    email: string;
    name: string;
    phone?: string;
  }) => void;
  bookingData?: Partial<BookingFormData>;
  onClose?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({
  onContinueAsGuest,
  onAuthenticated,
  bookingData,
  onClose,
}) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: bookingData?.guestEmail || "",
    password: "",
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    name: bookingData?.guestName || "",
    email: bookingData?.guestEmail || "",
    password: "",
    confirmPassword: "",
    phone: bookingData?.guestPhone || "",
  });

  // API mutations
  const [loginAPI, { isLoading: isLoginLoading }] = useLoginMutation();
  const [quickRegister, { isLoading: isRegisterLoading }] =
    useQuickRegisterMutation();
  const [fetchPermissions] = useLazyGetAuthPermissionsQuery();

  const isLoading = isLoginLoading || isRegisterLoading;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
  };

  const validateLoginForm = (): string[] => {
    const errors: string[] = [];
    if (!loginForm.email.trim()) errors.push("Email is required");
    if (!loginForm.password) errors.push("Password is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (loginForm.email && !emailRegex.test(loginForm.email)) {
      errors.push("Please enter a valid email address");
    }

    return errors;
  };

  const validateRegisterForm = (): string[] => {
    const errors: string[] = [];
    if (!registerForm.name.trim()) errors.push("Name is required");
    if (!registerForm.email.trim()) errors.push("Email is required");
    if (!registerForm.password) errors.push("Password is required");
    if (!registerForm.confirmPassword)
      errors.push("Please confirm your password");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (registerForm.email && !emailRegex.test(registerForm.email)) {
      errors.push("Please enter a valid email address");
    }

    if (registerForm.password && registerForm.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  const handleLogin = async () => {
    const errors = validateLoginForm();
    if (errors.length > 0) {
      setError(errors.join(". "));
      return;
    }

    try {
      const raw = await loginAPI(loginForm).unwrap();
      const res: any = raw as any;

      const resUser = res?.user || res?.data?.user || res;
      const token =
        res?.tokens?.access?.token ||
        res?.token ||
        res?.accessToken ||
        res?.data?.token;
      const refreshToken =
        res?.tokens?.refresh || res?.refreshToken || res?.data?.refreshToken;
      const role = resUser?.role || res?.role || res?.data?.role;

      const normalizedUser: any = {
        userId: resUser?.userId || resUser?.id || resUser?._id,
        id: resUser?.id || resUser?.userId || resUser?._id,
        _id: resUser?._id || resUser?.userId || resUser?.id,
        role: resUser?.role,
        email: resUser?.email,
        name:
          resUser?.name ||
          resUser?.displayName ||
          loginForm.email.split("@")[0],
        phone: resUser?.phone,
      };

      if (!normalizedUser.userId || !token) {
        throw new Error("Invalid response from server");
      }

      // Store refresh/access tokens and permissions if available
      if (refreshToken?.token && refreshToken?.expires) {
        Cookies.set("refreshToken", JSON.stringify(refreshToken), {
          expires: new Date(refreshToken.expires),
        });
      } else if (typeof refreshToken === "string") {
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        Cookies.set(
          "refreshToken",
          JSON.stringify({ token: refreshToken, expires }),
          {
            expires,
          }
        );
      }
      // Set authPermissions if present or fetch from roles endpoint
      if (res?.permissions || res?.authPermissions) {
        const perms = res?.permissions || res?.authPermissions;
        const permsArray = Array.isArray(perms) ? perms : [];
        Cookies.set("authPermissions", JSON.stringify(permsArray));
        window.dispatchEvent(new Event("permissions-updated"));
      } else {
        try {
          const searchRole = role || "client";
          const permsResp: any = await fetchPermissions(searchRole).unwrap();
          const permsArray = Array.isArray(permsResp?.[0]?.permissions)
            ? permsResp[0].permissions
            : [];
          Cookies.set("authPermissions", JSON.stringify(permsArray));
          window.dispatchEvent(new Event("permissions-updated"));
        } catch {}
      }

      // Use the login method from useAuth hook to handle all state updates
      login(normalizedUser, token);

      // Call success callback with user data
      onAuthenticated(normalizedUser);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(
        error?.data?.message ||
          error?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  const handleRegister = async () => {
    const errors = validateRegisterForm();
    if (errors.length > 0) {
      setError(errors.join(". "));
      return;
    }

    try {
      const result = await quickRegister({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        bookingContext: bookingData,
      }).unwrap();
      const normalizedUser: any = {
        userId: result.user.userId,
        id:
          (result.user as any).id ||
          result.user.userId ||
          (result.user as any)._id,
        _id:
          (result.user as any)._id ||
          result.user.userId ||
          (result.user as any).id,
        role: (result as any)?.user?.role,
        email: result.user.email,
        name: result.user.name || registerForm.name,
        phone: result.user.phone || registerForm.phone,
      };
      const role = (result as any)?.user?.role || "client";

      if (!result.token || !normalizedUser.userId) {
        throw new Error("Invalid response from server");
      }

      // Attempt to write permissions/refresh token if present in response
      if ((result as any)?.refreshToken) {
        Cookies.set(
          "refreshToken",
          JSON.stringify((result as any).refreshToken)
        );
      }
      if ((result as any)?.permissions) {
        const perms = (result as any).permissions;
        const permsArray = Array.isArray(perms) ? perms : [];
        Cookies.set("authPermissions", JSON.stringify(permsArray));
        window.dispatchEvent(new Event("permissions-updated"));
      } else {
        try {
          const permsResp: any = await fetchPermissions(role).unwrap();
          const permsArray = Array.isArray(permsResp?.[0]?.permissions)
            ? permsResp[0].permissions
            : [];
          Cookies.set("authPermissions", JSON.stringify(permsArray));
          window.dispatchEvent(new Event("permissions-updated"));
        } catch {}
      }

      // Use the login method from useAuth hook to handle all state updates
      login(normalizedUser, result.token);

      // Call success callback with user data
      onAuthenticated(normalizedUser);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error?.data?.message ||
          error?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      {/* Header */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Almost there!
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, lineHeight: 1.6 }}
      >
        You can continue to checkout as a guest, or create an account to track
        your project status using our internal system.
      </Typography>

      {/* <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4, fontSize: "0.9rem", fontStyle: "italic" }}
      >
        Creating an account allows you to monitor your booking progress and
        manage future sessions.
      </Typography> */}

      {/* Continue as Guest Button - Prominent */}
      <Button
        variant="outlined"
        size="large"
        fullWidth
        onClick={onContinueAsGuest}
        disabled={isLoading}
        sx={{
          mb: 3,
          py: 1.5,
          borderColor: "#D4B893",
          color: "#D4B893",
          fontSize: "1.1rem",
          fontWeight: "bold",
          textTransform: "none",
          "&:hover": {
            bgcolor: "#D4B893",
            color: "#000",
            borderColor: "#D4B893",
          },
        }}
      >
        Continue as Guest
      </Button>

      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Or
        </Typography>
      </Divider>

      {/* Auth Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab
          label="Login"
          sx={{
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: activeTab === 0 ? "bold" : "normal",
          }}
        />
        <Tab
          label="Create Account"
          sx={{
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: activeTab === 1 ? "bold" : "normal",
          }}
        />
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Login Form */}
      {activeTab === 0 && (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
            disabled={isLoading}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{
              py: 1.5,
              bgcolor: "#D4B893",
              color: "#000",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#C5A878",
              },
              "&:disabled": {
                bgcolor: "#E5E5E5",
                color: "#999",
              },
            }}
          >
            {isLoginLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Login & Continue"
            )}
          </Button>
        </Box>
      )}

      {/* Register Form */}
      {activeTab === 1 && (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <TextField
            fullWidth
            label="Full Name"
            value={registerForm.name}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, name: e.target.value })
            }
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={registerForm.email}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, email: e.target.value })
            }
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Phone Number (Optional)"
            value={registerForm.phone}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, phone: e.target.value })
            }
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={registerForm.password}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, password: e.target.value })
            }
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={registerForm.confirmPassword}
            onChange={(e) =>
              setRegisterForm({
                ...registerForm,
                confirmPassword: e.target.value,
              })
            }
            disabled={isLoading}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{
              py: 1.5,
              bgcolor: "#D4B893",
              color: "#000",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#C5A878",
              },
              "&:disabled": {
                bgcolor: "#E5E5E5",
                color: "#999",
              },
            }}
          >
            {isRegisterLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Account & Continue"
            )}
          </Button>
        </Box>
      )}

      {/* Benefits Text */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3, fontSize: "0.9rem", lineHeight: 1.4 }}
      >
        Creating an account lets you track your bookings, manage future
        sessions, and saves your information for faster booking next time.
      </Typography>
    </Box>
  );
};

export default AuthPrompt;
