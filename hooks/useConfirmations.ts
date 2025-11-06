import { useState } from "react";

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface UseConfirmationsReturn {
  confirmations: Record<string, ConfirmationState>;
  showConfirmation: (key: string, title: string, message: string, onConfirm: () => void) => void;
  hideConfirmation: (key: string) => void;
  executeConfirmation: (key: string) => void;
}

export const useConfirmations = (): UseConfirmationsReturn => {
  const [confirmations, setConfirmations] = useState<Record<string, ConfirmationState>>({});

  const showConfirmation = (
    key: string,
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmations(prev => ({
      ...prev,
      [key]: {
        isOpen: true,
        title,
        message,
        onConfirm,
      }
    }));
  };

  const hideConfirmation = (key: string) => {
    setConfirmations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isOpen: false,
      }
    }));
  };

  const executeConfirmation = (key: string) => {
    const confirmation = confirmations[key];
    if (confirmation && confirmation.onConfirm) {
      confirmation.onConfirm();
      hideConfirmation(key);
    }
  };

  return {
    confirmations,
    showConfirmation,
    hideConfirmation,
    executeConfirmation,
  };
};