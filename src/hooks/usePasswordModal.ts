import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_URL } from '../config/env';

interface Document {
  id: string;
  name: string;
  url?: string;
  isProtected: boolean;
  type?: string;
}

interface UsePasswordModalReturn {
  modalVisible: boolean;
  selectedDoc: Document | null;
  password: string;
  isVerifying: boolean;
  openModal: (doc: Document) => void;
  closeModal: () => void;
  verifyPassword: (docId: string) => Promise<void>;
  setPassword: (password: string) => void;
}

export const usePasswordModal = (): UsePasswordModalReturn => {
  const { token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const openModal = useCallback((doc: Document) => {
    setSelectedDoc(doc);
    setModalVisible(true);
    setPassword('');
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedDoc(null);
    setPassword('');
  }, []);

  const verifyPassword = useCallback(
    async (docId: string) => {
      if (!selectedDoc) return;

      setIsVerifying(true);
      try {
        const verifyEndpoint = token
          ? '/verify-password'
          : '/verify-password-public';
        const headers: any = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const requestBody = JSON.stringify({
          documentId: docId,
          password: password,
        });
        const res = await fetch(`${DOCUMENT_URL}${verifyEndpoint}`, {
          method: 'POST',
          headers,
          body: requestBody,
        });

        const data = await res.json();

        if (res.ok && data.downloadUrl) {
          // Thành công - sẽ xử lý download ở component
          return data;
        } else {
          if (!res.ok) {
            if (res.status === 401) {
              throw new Error('Invalid password');
            } else if (res.status === 404) {
              throw new Error('Document not found');
            } else if (res.status === 500) {
              throw new Error('Server error');
            }
          }
          throw new Error(data?.message || 'Verification failed');
        }
      } catch (err: any) {
        throw err;
      } finally {
        setIsVerifying(false);
      }
    },
    [token, selectedDoc, password]
  );

  return {
    modalVisible,
    selectedDoc,
    password,
    isVerifying,
    openModal,
    closeModal,
    verifyPassword,
    setPassword,
  };
};
