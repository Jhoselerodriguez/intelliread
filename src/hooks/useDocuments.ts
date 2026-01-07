import { useState, useEffect, useCallback } from 'react';
import type { Document } from '@/types';
import { getAllDocuments, saveDocument, deleteDocument as deleteDocFromDB, getDocument } from '@/lib/db';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await getAllDocuments();
      // Sort by upload date, newest first
      docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const addDocument = async (document: Document) => {
    await saveDocument(document);
    await loadDocuments();
  };

  const removeDocument = async (id: string) => {
    await deleteDocFromDB(id);
    await loadDocuments();
  };

  const getDocumentById = async (id: string): Promise<Document | undefined> => {
    return getDocument(id);
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    removeDocument,
    getDocumentById,
    refresh: loadDocuments,
  };
};
