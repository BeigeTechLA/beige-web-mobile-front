import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Chip,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Edit,
  CheckCircle,
  Schedule,
  LocationOn,
  CameraAlt,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/redux/hooks";
import type { RootState } from "@/lib/redux/store";
import { setBookingData } from "@/lib/redux/features/booking/bookingSlice";
import { useAuth } from "@/lib/hooks/useAuth";

const updateFormData = setBookingData;

interface AuthenticatedBookingFormProps {
  onValidationChange?: (isValid: boolean) => void;
  userData: {
    userId: string;
    email: string;
    name: string;
    phone?: string;
  };
}

const AuthenticatedBookingForm: React.FC<AuthenticatedBookingFormProps> = ({
  onValidationChange,
  userData,
}) => {
  const dispatch = useDispatch();
  const { formData, isAuthenticated } = useSelector(
    (state: RootState) => state.booking
  );
  const currentUser = useSelector(selectCurrentUser);
  const { user } = useAuth();

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(
    userData.phone || formData.guestPhone || ""
  );

  // Sales rep manual pricing state
  const [useManualPricing, setUseManualPricing] = useState(false);
  const [manualPrice, setManualPrice] = useState<number>(0);
  // Check for both 'sales_rep' and 'sales_representative' to handle different backend configurations
  const isSalesRep = user?.role === 'sales_rep' || user?.role === 'sales_representative';

  // Calculate total price
  const calculatedPrice = formData.durationHours * 250;
  const displayPrice = (isSalesRep && useManualPricing && manualPrice > 0) ? manualPrice : calculatedPrice;

  // Update formData with manual price when changed
  React.useEffect(() => {
    if (isSalesRep && useManualPricing && manualPrice > 0) {
      dispatch(updateFormData({ manualPrice }));
    }
  }, [isSalesRep, useManualPricing, manualPrice, dispatch]);

  React.useEffect(() => {
    // Prefill form with user data only when userData becomes available and form is empty
    if (isAuthenticated && userData && !formData.guestName) {
      dispatch(
        updateFormData({
          guestName: userData.name,
          guestEmail: userData.email,
          guestPhone: userData.phone || "",
        })
      );
    }
  }, [isAuthenticated, userData, dispatch, formData.guestName]);

  // Rendering is gated by parent step and auth state

  React.useEffect(() => {
    // Always valid for authenticated users
    onValidationChange?.(true);
  }, [onValidationChange]);

  const handlePhoneEdit = () => {
    setIsEditingPhone(true);
  };

  const handlePhoneSave = () => {
    dispatch(updateFormData({ guestPhone: tempPhone }));
    setIsEditingPhone(false);
  };

  const handlePhoneCancel = () => {
    setTempPhone(userData.phone || formData.guestPhone || "");
    setIsEditingPhone(false);
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Not selected";
    return new Date(dateTime).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getContentTypeDisplay = () => {
    if (formData.contentType === "both") return "Photo & Video";
    if (formData.contentType === "videography") return "Video";
    if (formData.contentType === "photography") return "Photo";
    return formData.contentType;
  };

  // TODO: use 'useAuth' to determine if 'isAuthenticated'
  // Don't render if user is not authenticated
  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <Box sx={{ p: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: "#D4B893",
            color: "#000",
            mr: 2,
            width: 48,
            height: 48,
          }}
        >
          {userData.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Welcome back, {userData.name.split(" ")[0]}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ready to book your session?
          </Typography>
        </Box>
      </Box>

      {/* Booking Summary Card */}
      <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center" }}
          >
            <CameraAlt sx={{ mr: 1, color: "#D4B893" }} />
            Booking Summary
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Schedule
                  sx={{ mr: 1, color: "text.secondary", fontSize: 20 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Date & Time:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ ml: 3, fontWeight: "medium" }}>
                {formatDateTime(formData.startDateTime)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <LocationOn
                  sx={{ mr: 1, color: "text.secondary", fontSize: 20 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ ml: 3, fontWeight: "medium" }}>
                {formData.needStudio
                  ? "Beige Studio"
                  : formData.location || "Not specified"}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Service:
                </Typography>
                <Chip
                  label={getContentTypeDisplay()}
                  size="small"
                  sx={{ bgcolor: "#D4B893", color: "#000" }}
                />
                <Chip
                  label={`${formData.durationHours} hours`}
                  size="small"
                  variant="outlined"
                />
                {formData.shootType && (
                  <Chip
                    label={formData.shootType}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sales Rep Manual Pricing */}
      {isSalesRep && (
        <Card sx={{ mb: 3, bgcolor: "#f0f7ff", border: "2px solid #D4B893" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", color: "#D4B893" }}
            >
              💰 Pricing Override (Sales Rep)
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={useManualPricing}
                  onChange={(e) => setUseManualPricing(e.target.checked)}
                  sx={{
                    color: "#D4B893",
                    '&.Mui-checked': {
                      color: "#D4B893",
                    },
                  }}
                />
              }
              label="Override automated pricing with custom amount"
              sx={{ mb: 2 }}
            />

            {useManualPricing && (
              <TextField
                fullWidth
                type="number"
                label="Manual Price ($)"
                value={manualPrice || ""}
                onChange={(e) => setManualPrice(Number(e.target.value))}
                inputProps={{ min: 500 }}
                placeholder="Enter custom price (minimum $500)"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: "#D4B893",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D4B893",
                  },
                }}
              />
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "white", borderRadius: 1 }}>
              <Typography variant="body1" color="text.secondary">
                {useManualPricing ? "Custom Price:" : "Calculated Price:"}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ${displayPrice}
              </Typography>
            </Box>

            {useManualPricing && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                💡 Original calculated price: ${calculatedPrice}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Information */}
      <Typography
        variant="h6"
        sx={{ mb: 2, display: "flex", alignItems: "center" }}
      >
        <CheckCircle sx={{ mr: 1, color: "success.main" }} />
        Your Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "success.light",
              color: "success.contrastText",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Person sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                  {userData.name}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "success.light",
              color: "success.contrastText",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Email sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                  {userData.email}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              bgcolor:
                userData.phone || formData.guestPhone
                  ? "success.light"
                  : "grey.100",
              color:
                userData.phone || formData.guestPhone
                  ? "success.contrastText"
                  : "text.primary",
            }}
          >
            {isEditingPhone ? (
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="Enter phone number"
                  InputProps={{
                    startAdornment: (
                      <Phone sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    onClick={handlePhoneSave}
                    variant="contained"
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={handlePhoneCancel}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Phone sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Phone Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      {userData.phone || formData.guestPhone || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  onClick={handlePhoneEdit}
                  startIcon={<Edit />}
                  sx={{ color: "inherit" }}
                >
                  {userData.phone || formData.guestPhone ? "Edit" : "Add"}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Benefits of Being Logged In */}
      <Box
        sx={{
          bgcolor: "#D4B893",
          color: "#000",
          p: 2,
          borderRadius: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: "medium", mb: 1 }}>
          ✨ You&apos;re all set as a registered user!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          You&apos;ll receive booking confirmations, can track your session
          history, and future bookings will be even faster.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthenticatedBookingForm;
