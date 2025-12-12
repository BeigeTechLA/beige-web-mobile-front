import React from "react";
import { cn } from "@/src/components/landing/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Container: React.FC<ContainerProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px] px-6 md:px-12",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
