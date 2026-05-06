import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  placeholder = "Enter text",
  className = "",
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`px-4 py-2 w-full rounded-none border-2 transition focus:outline-hidden ${
        props["aria-invalid"] ? "border-destructive text-destructive" : ""
      } ${className}`}
      {...props}
    />
  );
};
