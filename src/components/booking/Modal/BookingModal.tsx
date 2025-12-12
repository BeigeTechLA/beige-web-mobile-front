import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  ButtonGroup,
  Slider,
} from "@mui/material";
import { Close as CloseIcon, LocationOn, ArrowBack } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../../../redux/store";
import {
  closeBookingModal,
  updateFormData,
  setSubmitting,
  setAuthStatus,
  showAuthPrompt,
  hideAuthPrompt,
  setContinueAsGuest,
  prefillUserData,
  BookingFormData,
} from "../../../redux/features/booking/bookingSlice";
import { selectCurrentUser } from "../../../redux/features/auth/authSlice";
import { useAuth } from "../../../hooks/useAuth";
import AuthPrompt from "./AuthPrompt";
import GuestBookingForm from "./GuestBookingForm";
import AuthenticatedBookingForm from "./AuthenticatedBookingForm";

type BookingStep =
  | "projectNeeds"
  | "contentType"
  | "planSession"
  | "authCheck"
  | "contactInfo"
  | "review";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    formData,
    isSubmitting,
    error,
    showAuthPrompt: showAuth,
    continueAsGuest,
  } = useSelector((state: RootState) => state.booking);

  // Use the useAuth hook to get reliable auth state from cookies
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authIsLoading,
    updateBookingAuthStatus,
    prefillBookingData,
  } = useAuth();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<BookingStep>("projectNeeds");
  const [guestFormValid, setGuestFormValid] = useState(false);

  // Sales rep manual pricing state
  const [useManualPricing, setUseManualPricing] = useState(false);
  const [manualPrice, setManualPrice] = useState<number>(0);
  // Check for both 'sales_rep' and 'sales_representative' to handle different backend configurations
  const isSalesRep =
    currentUser?.role === "sales_rep" ||
    currentUser?.role === "sales_representative";

  // Debug: Log role detection once on mount
  useEffect(() => {
    console.log("🔍 BOOKING MODAL - Initial Role Detection:", {
      currentUserRole: currentUser?.role,
      currentUserEmail: currentUser?.email,
      isSalesRep,
      isAuthenticated,
      authIsLoading,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Memoize validation callbacks to prevent unnecessary re-renders
  const handleGuestValidationChange = useCallback((isValid: boolean) => {
    setGuestFormValid(isValid);
  }, []);

  const handleAuthValidationChange = useCallback((isValid: boolean) => {
    // Authenticated users are always valid, but we keep this for consistency
    // No state update needed since authenticated users always proceed
  }, []);

  // Check auth status on mount and when user changes
  useEffect(() => {
    // Wait for auth to finish loading before updating booking state
    if (authIsLoading) {
      return;
    }

    if (!updateBookingAuthStatus || !prefillBookingData) {
      return;
    }

    if (isAuthenticated && (currentUser?.userId || currentUser?.id)) {
      // Update booking auth status using the useAuth hook
      updateBookingAuthStatus();

      // Prefill booking data using the useAuth hook method
      prefillBookingData();
    } else {
      dispatch(setAuthStatus({ isAuthenticated: false }));
    }
  }, [
    authIsLoading,
    isAuthenticated,
    currentUser,
    updateBookingAuthStatus,
    prefillBookingData,
    dispatch,
  ]);

  // Calculate subtotal based on hours or manual price for sales reps
  const subtotal = useMemo(() => {
    if (isSalesRep && useManualPricing && manualPrice > 0) {
      return manualPrice;
    }
    return formData.durationHours * 250;
  }, [formData.durationHours, isSalesRep, useManualPricing, manualPrice]);

  const handleProjectNeedsSelect = (type: "shootAndEdit" | "shootAndRaw") => {
    dispatch(
      updateFormData({
        projectType: type,
        // Pre-set edit type based on selection
        editType: type === "shootAndEdit" ? "Standard Edit" : "None/Raw Files",
      })
    );
    setCurrentStep("contentType");
  };

  const handleContentTypeChange = (
    type: "videography" | "photography" | "both"
  ) => {
    dispatch(updateFormData({ contentType: type }));
    setCurrentStep("planSession");
  };

  const handlePlanSessionNext = () => {
    // Ensure location has a default before moving to auth step
    if (!formData.needStudio && !formData.location.trim()) {
      dispatch(updateFormData({ location: "Beige Studio" }));
    }

    // Wait for auth to finish loading before proceeding
    if (authIsLoading) {
      // Show auth check step which will handle the loading state
      setCurrentStep("authCheck");
      return;
    }

    // After completing plan session, check authentication
    // Use isAuthenticated and user from useAuth hook as the source of truth
    console.log("🔍 PLAN SESSION NEXT - Decision Point:", {
      isAuthenticated,
      hasUserId: !!(currentUser?.userId || currentUser?.id),
      isSalesRep,
      currentUserRole: currentUser?.role,
    });

    if (isAuthenticated && (currentUser?.userId || currentUser?.id)) {
      // SPECIAL CASE: Sales reps need to enter CLIENT info, not their own
      if (isSalesRep) {
        console.log("✅ ROUTING SALES REP TO CONTACT INFO");
        setCurrentStep("contactInfo");
      } else {
        console.log("✅ ROUTING REGULAR USER TO REVIEW");
        // Regular authenticated users skip auth prompt and go to review
        setCurrentStep("review");
      }
    } else {
      console.log("✅ ROUTING GUEST TO AUTH CHECK");
      // Show auth check step for non-authenticated users
      setCurrentStep("authCheck");
    }
  };

  const handleAuthPromptContinueAsGuest = useCallback(() => {
    dispatch(setContinueAsGuest(true));
    setCurrentStep("contactInfo");
  }, [dispatch]);

  const handleAuthenticated = useCallback(
    (user: { userId: string; email: string; name: string; phone?: string }) => {
      // The useAuth hook has already handled the login and state updates
      // Just prefill the form and proceed to review
      dispatch(
        prefillUserData({
          name: user.name,
          email: user.email,
          phone: user.phone,
        })
      );
      setCurrentStep("review");
    },
    [dispatch]
  );

  const handleContactInfoNext = () => {
    if (guestFormValid) {
      setCurrentStep("review");
    }
  };

  const handleDurationChange = (event: Event, newValue: number | number[]) => {
    dispatch(updateFormData({ durationHours: newValue as number }));
  };

  const handleClose = () => {
    dispatch(closeBookingModal());
    dispatch(hideAuthPrompt());
    setCurrentStep("projectNeeds"); // Reset to first step
    onClose();
  };

  const handleGoBack = () => {
    switch (currentStep) {
      case "contentType":
        setCurrentStep("projectNeeds");
        break;
      case "planSession":
        setCurrentStep("contentType");
        break;
      case "authCheck":
        setCurrentStep("planSession");
        break;
      case "contactInfo":
        if (showAuth) {
          dispatch(hideAuthPrompt());
          setCurrentStep("authCheck");
        } else {
          setCurrentStep("planSession");
        }
        break;
      case "review":
        // Sales reps go back to contactInfo, regular authenticated users go back to planSession
        if (
          isAuthenticated &&
          (currentUser?.userId || currentUser?.id) &&
          !isSalesRep
        ) {
          setCurrentStep("planSession");
        } else {
          setCurrentStep("contactInfo");
        }
        break;
      default:
        // If on first step, close modal
        handleClose();
        break;
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.contentType) {
      errors.push("Content type is required");
    }

    if (!formData.startDateTime) {
      errors.push("Start date and time is required");
    }

    if (formData.startDateTime) {
      const startDate = new Date(formData.startDateTime);

      if (startDate < new Date()) {
        errors.push("Start date cannot be in the past");
      }
    }

    if (!formData.needStudio && !formData.location.trim()) {
      errors.push("Location is required when not using Beige Studio");
    }

    if (!formData.shootType) {
      errors.push("Shoot type is required");
    }

    if (formData.durationHours < 2) {
      errors.push("Minimum booking duration is 2 hours");
    }

    // Guest information validation - only required for guest users
    if (continueAsGuest || !isAuthenticated) {
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
    }

    return errors;
  };

  const handleSubmit = async () => {
    // For authenticated users (NOT sales reps), ensure guest fields are populated with user data
    // Sales reps should NOT overwrite client info with their own info
    if (
      isAuthenticated &&
      (currentUser?.userId || currentUser?.id) &&
      !isSalesRep
    ) {
      dispatch(
        updateFormData({
          guestName: currentUser.name || currentUser.email || "",
          guestEmail: currentUser.email || "",
          guestPhone: currentUser.phone || formData.guestPhone || "",
        })
      );
    }

    // For sales reps, include manual price if set
    if (isSalesRep && useManualPricing && manualPrice > 0) {
      dispatch(
        updateFormData({
          manualPrice: manualPrice,
        })
      );
    }

    // Debug: Log form data before navigation
    console.log("🔍 BOOKING MODAL - Form data before navigation:", {
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      guestPhone: formData.guestPhone,
      isAuthenticated,
      continueAsGuest,
      currentUser: currentUser?.email || "none",
      isSalesRep,
      manualPrice: isSalesRep && useManualPricing ? manualPrice : null,
    });

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    // Show loading state
    dispatch(setSubmitting(true));

    try {
      // Simulate API validation or pre-processing if needed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Close modal and navigate to checkout
      handleClose();
      router.push("/booking/checkout");
    } catch (error) {
      console.error("Error during booking submission:", error);
      alert("There was an error processing your booking. Please try again.");
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  const hourMarks = [
    { value: 2, label: "2h" },
    { value: 4, label: "4h" },
    { value: 8, label: "8h" },
    { value: 12, label: "12h" },
    { value: 16, label: "16h" },
    { value: 20, label: "20h" },
    { value: 24, label: "24h" },
  ];

  const shootTypes = [
    "Brand Campaign",
    "Product Photography",
    "Lifestyle",
    "Event Coverage",
    "Portrait Session",
    "Commercial",
    "Other",
  ];

  const editTypes = [
    "None/Raw Files",
    "Basic Color Correction",
    "Advanced Color Grading",
    "Motion Graphics",
    "Visual Effects",
    "Audio Enhancement",
    "Quick Turnaround",
    "Standard Edit",
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case "projectNeeds":
        return (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
              My project needs
            </Typography>

            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => handleProjectNeedsSelect("shootAndEdit")}
                  disabled={isSubmitting}
                  sx={{
                    py: 2.5,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    borderColor: "#D4B893",
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "#D4B893",
                      color: "#000",
                      borderColor: "#D4B893",
                    },
                    "&:disabled": {
                      opacity: 0.6,
                    },
                  }}
                >
                  Shoot & Edit
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => handleProjectNeedsSelect("shootAndRaw")}
                  disabled={isSubmitting}
                  sx={{
                    py: 2.5,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    borderColor: "#D4B893",
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "#D4B893",
                      color: "#000",
                      borderColor: "#D4B893",
                    },
                    "&:disabled": {
                      opacity: 0.6,
                    },
                  }}
                >
                  Shoot & Raw Files
                </Button>
              </Grid>
            </Grid>
          </Box>
        );

      case "contentType":
        return (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
              Content Type
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => handleContentTypeChange("videography")}
                  sx={{
                    py: 2.5,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    borderColor: "#D4B893",
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "#D4B893",
                      color: "#000",
                      borderColor: "#D4B893",
                    },
                  }}
                >
                  Videography
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => handleContentTypeChange("photography")}
                  sx={{
                    py: 2.5,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    borderColor: "#D4B893",
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "#D4B893",
                      color: "#000",
                      borderColor: "#D4B893",
                    },
                  }}
                >
                  Photography
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => handleContentTypeChange("both")}
                  sx={{
                    py: 2.5,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    borderColor: "#D4B893",
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "#D4B893",
                      color: "#000",
                      borderColor: "#D4B893",
                    },
                  }}
                >
                  Both
                </Button>
              </Grid>
            </Grid>

            <Box
              sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
            >
              <Button
                variant="outlined"
                size="large"
                onClick={handleGoBack}
                sx={{
                  borderColor: "#D4B893",
                  color: "#D4B893",
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "#D4B893",
                    color: "#000",
                    borderColor: "#D4B893",
                  },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => setCurrentStep("planSession")}
                sx={{
                  bgcolor: "#D4B893",
                  color: "#000",
                  fontWeight: "bold",
                  px: 6,
                  py: 1.5,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "#C5A878",
                  },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case "planSession":
        return (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, textAlign: "center" }}>
              Let&apos;s Plan Your Session
            </Typography>

            <Grid container spacing={4}>
              {/* Start Date & Time */}
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={
                    formData.startDateTime
                      ? new Date(formData.startDateTime)
                      : null
                  }
                  onChange={(newValue) =>
                    dispatch(
                      updateFormData({
                        startDateTime: newValue?.toISOString() || null,
                      })
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: "dd/mm/yyyy, --:--",
                    },
                  }}
                />
              </Grid>

              {/* Duration Hours */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Duration: {formData.durationHours} hours
                </Typography>
                <Slider
                  value={formData.durationHours}
                  onChange={handleDurationChange}
                  min={2}
                  max={24}
                  step={1}
                  marks={hourMarks}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}h`}
                  sx={{
                    color: "#C9B896",
                    "& .MuiSlider-thumb": {
                      backgroundColor: "#C9B896",
                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: "0 0 0 8px rgba(201, 184, 150, 0.16)",
                      },
                      "&.Mui-active": {
                        boxShadow: "0 0 0 14px rgba(201, 184, 150, 0.16)",
                      },
                    },
                    "& .MuiSlider-track": {
                      backgroundColor: "#C9B896",
                      borderColor: "#C9B896",
                    },
                    "& .MuiSlider-rail": {
                      backgroundColor: "#E8E1D5",
                    },
                    "& .MuiSlider-mark": {
                      backgroundColor: "#C9B896",
                    },
                    "& .MuiSlider-markActive": {
                      backgroundColor: "#C9B896",
                    },
                  }}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="47 W 13th St, New York, NY 10011, USA"
                  value={
                    formData.needStudio
                      ? "Professional studio with lighting & equipment"
                      : formData.location
                  }
                  onChange={(e) =>
                    dispatch(updateFormData({ location: e.target.value }))
                  }
                  disabled={formData.needStudio}
                  InputProps={{
                    startAdornment: (
                      <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              {/* Studio Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.needStudio}
                      onChange={(e) =>
                        dispatch(
                          updateFormData({ needStudio: e.target.checked })
                        )
                      }
                    />
                  }
                  label="I need a Beige Studio"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4 }}
                >
                  Professional studio with lighting & equipment
                </Typography>
              </Grid>

              {/* Shoot Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Shoot Type</InputLabel>
                  <Select
                    value={formData.shootType || ""}
                    label="Shoot Type"
                    onChange={(e) =>
                      dispatch(updateFormData({ shootType: e.target.value }))
                    }
                  >
                    {shootTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Edit Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type of Edit</InputLabel>
                  <Select
                    value={formData.editType || ""}
                    label="Type of Edit"
                    onChange={(e) =>
                      dispatch(updateFormData({ editType: e.target.value }))
                    }
                  >
                    {editTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Dynamic Pricing Display */}
              {/* <Grid item xs={12}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    border: 1,
                    borderColor: "grey.200",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Pricing Summary
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formData.durationHours} hours × $250/hour = ${subtotal}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ mt: 1, fontWeight: "bold", color: "primary.main" }}
                  >
                    Total: ${subtotal}
                  </Typography>
                </Box>
              </Grid> */}
            </Grid>
          </Box>
        );

      case "authCheck":
        return (
          <AuthPrompt
            onContinueAsGuest={handleAuthPromptContinueAsGuest}
            onAuthenticated={handleAuthenticated}
            bookingData={formData}
          />
        );

      case "contactInfo":
        return (
          <GuestBookingForm onValidationChange={handleGuestValidationChange} />
        );

      case "review":
        // Sales reps should use guest review flow (to see client info + manual pricing)
        console.log("🔍 REVIEW STEP - Rendering Decision:", {
          isAuthenticated,
          hasUserId: !!(currentUser?.userId || currentUser?.id),
          isSalesRep,
          currentUserRole: currentUser?.role,
          willShowAuthenticatedForm:
            isAuthenticated &&
            (currentUser?.userId || currentUser?.id) &&
            !isSalesRep,
        });

        if (
          isAuthenticated &&
          (currentUser?.userId || currentUser?.id) &&
          !isSalesRep
        ) {
          console.log("✅ RENDERING AUTHENTICATED BOOKING FORM");
          return (
            <AuthenticatedBookingForm
              userData={{
                userId: currentUser.userId || currentUser.id || "",
                email: currentUser.email || "",
                name: currentUser.name || currentUser.email || "",
                phone: currentUser.phone,
              }}
              onValidationChange={handleAuthValidationChange}
            />
          );
        } else {
          console.log(
            "✅ RENDERING GUEST REVIEW FORM (for guests OR sales reps)"
          );
          // Show final review for guest users AND sales reps
          return (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Review Your Booking
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You&apos;re all set! Click &quot;Book Now&quot; to proceed to
                payment.
              </Typography>
              <Box
                sx={{
                  p: 3,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: 1,
                  borderColor: "grey.200",
                  textAlign: "left",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Booking Summary
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Service:</strong>{" "}
                  {formData.contentType === "both"
                    ? "Photo & Video"
                    : formData.contentType}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Duration:</strong> {formData.durationHours} hours
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Date:</strong>{" "}
                  {formData.startDateTime
                    ? new Date(formData.startDateTime).toLocaleString()
                    : "Not selected"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Location:</strong>{" "}
                  {formData.needStudio ? "Beige Studio" : formData.location}
                </Typography>

                {/* Sales Rep Manual Pricing UI */}
                {isSalesRep && (
                  <Box
                    sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={useManualPricing}
                          onChange={(e) =>
                            setUseManualPricing(e.target.checked)
                          }
                          sx={{ color: "#D4B893" }}
                        />
                      }
                      label="Custom pricing (Sales Rep)"
                      sx={{ mb: 1 }}
                    />
                    {useManualPricing && (
                      <TextField
                        type="number"
                        label="Manual Price ($)"
                        value={manualPrice || ""}
                        onChange={(e) => setManualPrice(Number(e.target.value))}
                        fullWidth
                        inputProps={{ min: 500 }}
                        placeholder="Enter custom price"
                        sx={{
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
                  </Box>
                )}

                <Typography variant="h6" color="primary">
                  Total: ${subtotal}
                </Typography>
              </Box>
            </Box>
          );
        }

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="booking-modal-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "95%", sm: "90%" },
            maxWidth:
              currentStep === "planSession"
                ? { xs: 400, sm: 600, md: 900 }
                : { xs: 400, sm: 600 },
            maxHeight: { xs: "95vh", sm: "90vh" },
            bgcolor: "background.paper",
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: 24,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {currentStep !== "projectNeeds" && (
                <IconButton
                  onClick={handleGoBack}
                  size="large"
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              )}
              <Typography
                variant="h4"
                component="h2"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "2rem" },
                  lineHeight: 1.2,
                }}
              >
                Book Your Shoot Now
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              size="large"
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
            {renderStepContent()}
          </Box>

          {/* Footer - Show on steps that need navigation */}
          {(currentStep === "planSession" ||
            currentStep === "contactInfo" ||
            currentStep === "review") && (
            <Box
              sx={{
                p: 3,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                size="large"
                onClick={handleGoBack}
                sx={{
                  borderColor: "#D4B893",
                  color: "#D4B893",
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: 16,
                  "&:hover": {
                    bgcolor: "#D4B893",
                    color: "#000",
                    borderColor: "#D4B893",
                  },
                }}
              >
                Back
              </Button>

              {currentStep === "planSession" && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePlanSessionNext}
                  sx={{
                    bgcolor: "#D4B893",
                    color: "#000",
                    fontWeight: "bold",
                    px: 6,
                    py: 1.5,
                    textTransform: "none",
                    fontSize: 16,
                    "&:hover": {
                      bgcolor: "#C5A878",
                    },
                  }}
                >
                  Continue
                </Button>
              )}

              {currentStep === "contactInfo" && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleContactInfoNext}
                  disabled={!guestFormValid}
                  sx={{
                    bgcolor: "#D4B893",
                    color: "#000",
                    fontWeight: "bold",
                    px: 6,
                    py: 1.5,
                    textTransform: "none",
                    fontSize: 16,
                    "&:hover": {
                      bgcolor: "#C5A878",
                    },
                    "&:disabled": {
                      bgcolor: "#E5E5E5",
                      color: "#999",
                    },
                  }}
                >
                  Review Booking
                </Button>
              )}

              {currentStep === "review" && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: "#D4B893",
                    color: "#000",
                    fontWeight: "bold",
                    px: 6,
                    py: 1.5,
                    textTransform: "none",
                    fontSize: 16,
                    "&:hover": {
                      bgcolor: "#C5A878",
                    },
                    "&:disabled": {
                      bgcolor: "#E5E5E5",
                      color: "#999",
                    },
                  }}
                >
                  {isSubmitting ? "Processing..." : `Book Now ($${subtotal})`}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Modal>
    </LocalizationProvider>
  );
};

export default BookingModal;
