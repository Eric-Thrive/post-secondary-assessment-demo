
import { useState } from 'react';

export const useProcessingState = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const startProcessing = () => setIsProcessing(true);
  const stopProcessing = () => setIsProcessing(false);

  return {
    isProcessing,
    startProcessing,
    stopProcessing
  };
};
