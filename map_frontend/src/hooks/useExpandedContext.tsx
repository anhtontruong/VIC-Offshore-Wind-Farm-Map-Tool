import { createContext, useContext, useState, type ReactNode } from "react";

type ExpandedContextType = {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  toggleExpanded: () => void;
};

export const ExpandedContext = createContext<ExpandedContextType | null>(null);


// =========================
//  CONTEXT HOOK (CONSUMER)
// =========================
export function useExpandedContext() {
  const context = useContext(ExpandedContext);

  if (!context) {
    throw new Error(
      "useExpandedContext must be used within ExpandedContext.Provider"
    );
  }

  return context;
}

type ExpandedProviderProps = {
  children: ReactNode;
};

// ==========
//  PROVIDER
// ==========
export function ExpandedProvider({
  children,
}: ExpandedProviderProps) {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <ExpandedContext.Provider
      value={{
        expanded,
        setExpanded,
        toggleExpanded,
      }}
    >
      {children}
    </ExpandedContext.Provider>
  );
}
