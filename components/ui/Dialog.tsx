import React from "react";
import Button from "./Button";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform scale-100 transition-transform">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            icon={X}
            className="p-1 rounded-full text-gray-500 hover:text-gray-800"
          />
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Dialog;