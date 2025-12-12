"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, ButtonProps } from "@mui/material";
import { RootState } from "../../redux/store";
import { openBookingModal } from "../../redux/features/booking/bookingSlice";
import BookingModal from "./Modal/BookingModal";
import { DefaultButton } from "../Buttons/DefaultButton";

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
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((state: RootState) => state.booking);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const handleOpenModal = () => {
    dispatch(openBookingModal());
    setLocalModalOpen(true);
  };

  const handleCloseModal = () => {
    setLocalModalOpen(false);
  };

  const renderButton = () => {
    if (variant === "mui") {
      return (
        <Button
          variant={muiVariant}
          color={muiColor}
          size={muiSize}
          onClick={handleOpenModal}
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
        onClick={handleOpenModal}
        disabled={disabled}
        className={className}
      >
        {children || buttonText}
      </DefaultButton>
    );
  };

  return (
    <>
      {renderButton()}
      <BookingModal
        open={localModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default BookingModalButton;