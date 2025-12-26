"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "@mui/material";

// Placeholder for DefaultButton - create this component or use MUI Button
const DefaultButton = Button;

interface BookingModalButtonProps {
  children?: React.ReactNode;
  variant?: "default" | "mui";
  buttonText?: string;
  // DefaultButton props
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  size?: "small" | "medium" | "large";
  width?: string;
  fontSize?: string;
  className?: string;
  // MUI Button props
  muiVariant?: ButtonProps["variant"];
  muiColor?: ButtonProps["color"];
  muiSize?: ButtonProps["size"];
  sx?: ButtonProps["sx"];
  disabled?: boolean;
  fullWidth?: boolean;
}

const BookingModalButton: React.FC<BookingModalButtonProps> = ({
  children,
  variant = "default",
  buttonText = "Book a Shoot",
  // DefaultButton props
  color = "primary",
  size = "medium",
  width,
  fontSize = "15px",
  className,
  // MUI Button props
  muiVariant = "contained",
  muiColor = "primary",
  muiSize = "medium",
  sx,
  disabled = false,
  fullWidth = false,
}) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/book-a-shoot');
  };

  const renderButton = () => {
    if (variant === "mui") {
      return (
        <Button
          variant={muiVariant}
          color={muiColor}
          size={muiSize}
          onClick={handleNavigate}
          disabled={disabled}
          fullWidth={fullWidth}
          sx={sx}
          className={className}
        >
          {children || buttonText}
        </Button>
      );
    }

    // Default variant using DefaultButton
    return (
      <DefaultButton
        variant="contained"
        color={color}
        fontSize={fontSize}
        size={size}
        width={width}
        onClick={handleNavigate}
        disabled={disabled}
        className={className}
      >
        {children || buttonText}
      </DefaultButton>
    );
  };

  return renderButton();
};

export default BookingModalButton;