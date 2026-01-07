import { useState, useEffect, useCallback } from 'react';
import type { APIKeys, AIProvider } from '@/types';
import { getAPIKeys, saveAPIKeys } from '@/lib/db';
import { getAvailableProviders } from '@/lib/apiClient';

export const useAPIKeys = () => {
  const [apiKeys, setApiKeys] = useState<APIKeys | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);

  const loadAPIKeys = useCallback(async () => {
    try {
      setLoading(true);
      const keys = await getAPIKeys();
      setApiKeys(keys);
      setAvailableProviders(getAvailableProviders(keys));
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAPIKeys();
  }, [loadAPIKeys]);

  const updateAPIKeys = async (keys: APIKeys) => {
    await saveAPIKeys(keys);
    setApiKeys(keys);
    setAvailableProviders(getAvailableProviders(keys));
  };

  // Mandatory keys: Gemini, Groq, Perplexity
  // Claude (anthropic) is optional
  const hasMandatoryKeys = Boolean(
    apiKeys?.geminiApiKey && 
    apiKeys?.groqApiKey && 
    apiKeys?.perplexityApiKey
  );

  const hasAnyKey = Boolean(
    apiKeys?.groqApiKey || 
    apiKeys?.perplexityApiKey || 
    apiKeys?.anthropicApiKey ||
    apiKeys?.geminiApiKey
  );

  return {
    apiKeys,
    loading,
    availableProviders,
    updateAPIKeys,
    hasAnyKey,
    hasMandatoryKeys,
    refresh: loadAPIKeys,
  };
};
