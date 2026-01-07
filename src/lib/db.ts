import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Document, Chunk, ExtractedTable, ExtractedImage, ChatHistory, APIKeys, AIProvider } from '@/types';

interface IntelliReadDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
    indexes: { 'by-date': Date };
  };
  chunks: {
    key: string;
    value: Chunk;
    indexes: { 'by-document': string };
  };
  tables: {
    key: string;
    value: ExtractedTable;
    indexes: { 'by-document': string };
  };
  images: {
    key: string;
    value: ExtractedImage;
    indexes: { 'by-document': string };
  };
  chats: {
    key: string;
    value: ChatHistory;
    indexes: { 'by-document': string };
  };
  apiKeys: {
    key: string;
    value: APIKeys & { id: string };
  };
}

let dbInstance: IDBPDatabase<IntelliReadDB> | null = null;

export const getDB = async (): Promise<IDBPDatabase<IntelliReadDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<IntelliReadDB>('intelliReadDB', 2, {
    upgrade(db, oldVersion) {
      // Documents store
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('by-date', 'uploadDate');
      }

      // Chunks store
      if (!db.objectStoreNames.contains('chunks')) {
        const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
        chunkStore.createIndex('by-document', 'documentId');
      }

      // Tables store
      if (!db.objectStoreNames.contains('tables')) {
        const tableStore = db.createObjectStore('tables', { keyPath: 'id' });
        tableStore.createIndex('by-document', 'documentId');
      }

      // Images store
      if (!db.objectStoreNames.contains('images')) {
        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('by-document', 'documentId');
      }

      // Chats store
      if (!db.objectStoreNames.contains('chats')) {
        const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
        chatStore.createIndex('by-document', 'documentId');
      }

      // API Keys store
      if (!db.objectStoreNames.contains('apiKeys')) {
        db.createObjectStore('apiKeys', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
};

// Document operations
export const saveDocument = async (document: Document): Promise<void> => {
  const db = await getDB();
  await db.put('documents', document);
};

export const getDocument = async (id: string): Promise<Document | undefined> => {
  const db = await getDB();
  return db.get('documents', id);
};

export const getAllDocuments = async (): Promise<Document[]> => {
  const db = await getDB();
  return db.getAll('documents');
};

export const deleteDocument = async (id: string): Promise<void> => {
  const db = await getDB();
  
  // Delete document
  await db.delete('documents', id);
  
  // Delete related chunks
  const chunks = await db.getAllFromIndex('chunks', 'by-document', id);
  for (const chunk of chunks) {
    await db.delete('chunks', chunk.id);
  }
  
  // Delete related tables
  const tables = await db.getAllFromIndex('tables', 'by-document', id);
  for (const table of tables) {
    await db.delete('tables', table.id);
  }
  
  // Delete related images
  const images = await db.getAllFromIndex('images', 'by-document', id);
  for (const image of images) {
    await db.delete('images', image.id);
  }
  
  // Delete related chats
  const chats = await db.getAllFromIndex('chats', 'by-document', id);
  for (const chat of chats) {
    await db.delete('chats', chat.id);
  }
};

// Delete chat history for specific provider
export const deleteChatHistory = async (documentId: string, provider: AIProvider): Promise<void> => {
  const db = await getDB();
  const chatId = `${documentId}_${provider}`;
  await db.delete('chats', chatId);
};

// Chunk operations
export const saveChunk = async (chunk: Chunk): Promise<void> => {
  const db = await getDB();
  await db.put('chunks', chunk);
};

export const getChunksByDocument = async (documentId: string): Promise<Chunk[]> => {
  const db = await getDB();
  return db.getAllFromIndex('chunks', 'by-document', documentId);
};

// Table operations
export const saveTable = async (table: ExtractedTable): Promise<void> => {
  const db = await getDB();
  await db.put('tables', table);
};

export const getTablesByDocument = async (documentId: string): Promise<ExtractedTable[]> => {
  const db = await getDB();
  return db.getAllFromIndex('tables', 'by-document', documentId);
};

// Image operations
export const saveImage = async (image: ExtractedImage): Promise<void> => {
  const db = await getDB();
  await db.put('images', image);
};

export const getImagesByDocument = async (documentId: string): Promise<ExtractedImage[]> => {
  const db = await getDB();
  return db.getAllFromIndex('images', 'by-document', documentId);
};

// Chat operations
export const saveChatHistory = async (chat: ChatHistory): Promise<void> => {
  const db = await getDB();
  await db.put('chats', chat);
};

export const getChatHistory = async (documentId: string, provider: string): Promise<ChatHistory | undefined> => {
  const db = await getDB();
  const id = `${documentId}_${provider}`;
  return db.get('chats', id);
};

export const getChatsByDocument = async (documentId: string): Promise<ChatHistory[]> => {
  const db = await getDB();
  return db.getAllFromIndex('chats', 'by-document', documentId);
};

// API Keys operations
export const saveAPIKeys = async (keys: APIKeys): Promise<void> => {
  const db = await getDB();
  await db.put('apiKeys', { id: 'config', ...keys });
};

export const getAPIKeys = async (): Promise<APIKeys | undefined> => {
  const db = await getDB();
  const config = await db.get('apiKeys', 'config');
  if (config) {
    const { id, ...keys } = config;
    return keys;
  }
  return undefined;
};
