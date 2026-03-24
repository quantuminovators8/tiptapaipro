"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { TiptapAiProConfig } from '../types';

const TiptapAiProContext = createContext<TiptapAiProConfig | undefined>(undefined);

export const TiptapAiProProvider: React.FC<{
  config: TiptapAiProConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  return (
    <TiptapAiProContext.Provider value={config}>
      {children}
    </TiptapAiProContext.Provider>
  );
};

export const useTiptapAiProConfig = () => {
  return useContext(TiptapAiProContext);
};

export const defineConfig = (config: TiptapAiProConfig): TiptapAiProConfig => {
  return config;
};
