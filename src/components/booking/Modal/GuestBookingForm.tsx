import React from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Alert,
  Divider,
} from "@mui/material";
import { Person, Email, Phone } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../redux/store";
import { updateFormData } from "../../../redux/features/booking/bookingSlice";
import { useAuth } from "../../../hooks/useAuth";

interface GuestBookingFormProps {
  onValidationChange?: (isValid: boolean) => void;
}

const GuestBookingForm: React.FC<GuestBookingFormProps> = ({
  onValidationChange,
}) => {
  const dispatch = useDispatch();
  const { formData, isAuthenticated } = useSelector(
    (state: RootState) => state.booking
  );
  const { user } = useAuth();

  // Check if user is a sales rep (they need to enter CLIENT info)
  const isSalesRep = user?.role === 'sales_rep' || user?.role === 'sales_representative';

  const validateGuestInfo = React.useCallback(() => {
    const errors: string[] = [];

    if (!formData.guestName?.trim()) {
      errors.push("Name is required");
    }

    if (!formData.guestEmail?.trim()) {
      errors.push("Email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.guestEmail)) {
        errors.push("Please enter a valid email address");
      }
    }

    if (!formData.guestPhone?.trim()) {
      errors.push("Phone number is required");
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }, [formData.guestName, formData.guestEmail, formData.guestPhone]);

  React.useEffect(() => {
    const { isValid } = validateGuestInfo();
    onValidationChange?.(isValid);
  }, [validateGuestInfo, onValidationChange]);

  // Don't render if user is authenticated UNLESS they are a sales rep
  // Sales reps need to enter CLIENT information even though they're authenticated
  if (isAuthenticated && !isSalesRep) {
    return null;
  }

  const { errors } = validateGuestInfo();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
        {isSalesRep ? "Client Contact Information" : "Contact Information"}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, textAlign: "center" }}
      >
        {isSalesRep
          ? "Enter your client's contact information. They'll receive booking confirmations and updates at this email."
          : "We'll use this information to send you booking confirmations and updates."
        }
      </Typography>

      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please complete all required fields:
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={isSalesRep ? "Client's Full Name" : "Full Name"}
            placeholder={isSalesRep ? "Enter client's full name" : "Enter your full name"}
            value={formData.guestName || ""}
            onChange={(e) =>
              dispatch(updateFormData({ guestName: e.target.value }))
            }
            required
            InputProps={{
              startAdornment: (
                <Person sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#D4B893",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#D4B893",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#D4B893",
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label={isSalesRep ? "Client's Email Address" : "Email Address"}
            type="email"
            placeholder={isSalesRep ? "Enter client's email" : "Enter your email"}
            value={formData.guestEmail || ""}
            onChange={(e) =>
              dispatch(updateFormData({ guestEmail: e.target.value }))
            }
            required
            InputProps={{
              startAdornment: (
                <Email sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#D4B893",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#D4B893",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#D4B893",
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label={isSalesRep ? "Client's Phone Number" : "Phone Number"}
            placeholder={isSalesRep ? "Enter client's phone number" : "Enter your phone number"}
            value={formData.guestPhone || ""}
            onChange={(e) =>
              dispatch(updateFormData({ guestPhone: e.target.value }))
            }
            required
            InputProps={{
              startAdornment: (
                <Phone sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#D4B893",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#D4B893",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#D4B893",
              },
            }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Only show account creation prompt for guest users, not sales reps */}
      {!isSalesRep && (
        <Box
          sx={{
            bgcolor: "grey.50",
            p: 2,
            borderRadius: 2,
            border: 1,
            borderColor: "grey.200",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            💡 <strong>Want to save time next time?</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Creating an account lets you track your bookings, manage future sessions,
            and saves your information for faster booking. You can always create one later!
          </Typography>
        </Box>
      )}

      {/* Sales rep info box */}
      {isSalesRep && (
        <Box
          sx={{
            bgcolor: "#f0f7ff",
            p: 2,
            borderRadius: 2,
            border: 1,
            borderColor: "#D4B893",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
            📋 Sales Rep Booking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You're creating a booking for your client. They'll receive all booking confirmations and updates directly.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GuestBookingForm;