import { createContext, useContext, useState, ReactNode } from 'react';

interface AIChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialMessage: string;
  setInitialMessage: (message: string) => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  return (
    <AIChatContext.Provider value={{ isOpen, setIsOpen, initialMessage, setInitialMessage }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}