import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage, AIProvider, ChatHistory, Chunk } from '@/types';
import { getChatHistory, saveChatHistory, getChunksByDocument } from '@/lib/db';
import { callAI } from '@/lib/apiClient';
import { searchChunks } from '@/lib/vectorSearch';

export const useChat = (
  documentId: string | undefined,
  provider: AIProvider,
  apiKey: string | undefined
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);

  // Load chat history when document or provider changes
  useEffect(() => {
    const loadChat = async () => {
      if (!documentId) {
        setMessages([]);
        return;
      }

      try {
        const history = await getChatHistory(documentId, provider);
        if (history) {
          setMessages(history.messages);
        } else {
          setMessages([]);
        }

        // Load chunks for search
        const docChunks = await getChunksByDocument(documentId);
        setChunks(docChunks);
      } catch (err) {
        console.error('Failed to load chat:', err);
        setMessages([]);
      }
    };

    loadChat();
  }, [documentId, provider]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!documentId || !apiKey || !content.trim()) {
      throw new Error('Missing required parameters');
    }

    setLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // Search for relevant chunks
      const relevantChunks = searchChunks(content, chunks, 5);
      const context = relevantChunks
        .map(c => `[Page ${c.page}, ${c.section}]: ${c.text}`)
        .join('\n\n');

      // Call AI
      const response = await callAI(provider, apiKey, newMessages, context);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        citations: relevantChunks.map(c => ({
          chunkId: c.id,
          page: c.page,
          text: c.text.substring(0, 100) + '...',
        })),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to IndexedDB
      const chatHistory: ChatHistory = {
        id: `${documentId}_${provider}`,
        documentId,
        provider,
        timestamp: new Date(),
        messages: finalMessages,
      };
      await saveChatHistory(chatHistory);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      // Remove user message on error
      setMessages(messages);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [documentId, apiKey, provider, messages, chunks]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
  };
};
