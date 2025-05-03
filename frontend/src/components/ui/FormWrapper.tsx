import React, { ReactNode } from "react";

interface FormWrapperProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function FormWrapper({ children, className = "", onSubmit }: FormWrapperProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`mx-auto max-w-md p-6 bg-card text-card-foreground rounded-xl shadow-md space-y-6 ${className}`}
    >
      {children}
    </form>
  );
}

