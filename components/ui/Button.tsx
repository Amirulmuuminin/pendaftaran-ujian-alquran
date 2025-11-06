import React from "react";

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  icon?: React.ComponentType<{ size?: number }>;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  className = "",
  disabled = false,
  type = "button",
  title,
}) => {
  const baseStyle =
    "px-4 py-2 font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed";
  let colorStyle;

  switch (variant) {
    case "primary":
      colorStyle = "bg-blue-600 hover:bg-blue-700 text-white";
      break;
    case "secondary":
      colorStyle = "bg-gray-200 hover:bg-gray-300 text-gray-800";
      break;
    case "destructive":
      colorStyle = "bg-red-600 hover:bg-red-700 text-white";
      break;
    case "outline":
      colorStyle =
        "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50";
      break;
    case "ghost":
      colorStyle = "bg-transparent text-gray-700 hover:bg-gray-100 shadow-none";
      break;
    default:
      colorStyle = "bg-blue-600 hover:bg-blue-700 text-white";
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${colorStyle} ${className}`}
      disabled={disabled}
      type={type}
      title={title}
    >
      {Icon && <Icon size={20} />}
      {children && <span>{children}</span>}
    </button>
  );
};

export default Button;