import React from "react";

interface InputProps {
  label?: string;
  type?: "text" | "email" | "password" | "number" | "date" | "time";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  className = "",
  required = false,
}) => (
  <div className="space-y-1 w-full">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-500 ${className}`}
    />
  </div>
);

export default Input;