import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';

interface MessageDraft {
  id: string;
  userId: string;
  leadId: string;
  content: string;
  subject?: string;
  channel: string;
  savedAt: string;
  updatedAt: string;
}

interface UseDraftOptions {
  leadId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * Hook for managing message drafts
 * Automatically saves drafts with debouncing
 */
export function useDraft(options: UseDraftOptions = {}) {
  const { leadId, autoSave = true, autoSaveDelay = 500 } = options;
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [channel, setChannel] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch existing draft
  const { data: draftData, mutate: refetchDraft } = useSWR(
    leadId ? `/api/drafts/${leadId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch draft');
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  // Load draft on mount or when leadId changes
  useEffect(() => {
    if (draftData?.draft) {
      setContent(draftData.draft.content || '');
      setSubject(draftData.draft.subject || '');
      setChannel(draftData.draft.channel || 'email');
    } else {
      setContent('');
      setSubject('');
      setChannel('email');
    }
  }, [draftData]);

  // Auto-save with debouncing
  const saveDraft = useCallback(async (text: string, subj?: string, ch?: string) => {
    if (!leadId) return;

    const contentToSave = text || content;
    const subjectToSave = subj || subject;
    const channelToSave = ch || channel;

    if (!contentToSave.trim()) {
      // Don't save empty drafts
      return;
    }

    try {
      const res = await fetch(`/api/drafts/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToSave,
          subject: subjectToSave,
          channel: channelToSave
        })
      });

      if (!res.ok) throw new Error('Failed to save draft');
      const data = await res.json();
      return data.draft;
    } catch (error) {
      console.error('[v0] Draft save error:', error);
      throw error;
    }
  }, [leadId, content, subject, channel]);

  // Debounced auto-save
  const handleContentChange = useCallback((text: string) => {
    setContent(text);

    if (autoSave && leadId) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft(text, subject, channel);
      }, autoSaveDelay);
    }
  }, [autoSave, leadId, subject, channel, autoSaveDelay, saveDraft]);

  const handleSubjectChange = useCallback((text: string) => {
    setSubject(text);

    if (autoSave && leadId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft(content, text, channel);
      }, autoSaveDelay);
    }
  }, [autoSave, leadId, content, channel, autoSaveDelay, saveDraft]);

  const deleteDraft = useCallback(async () => {
    if (!leadId) return;

    try {
      const res = await fetch(`/api/drafts/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete draft');

      setContent('');
      setSubject('');
      await refetchDraft();
    } catch (error) {
      console.error('[v0] Draft delete error:', error);
      throw error;
    }
  }, [leadId, refetchDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content,
    subject,
    channel,
    setContent: handleContentChange,
    setSubject: handleSubjectChange,
    setChannel,
    isDraft: !!draftData?.draft,
    saveDraft,
    deleteDraft,
    isLoading
  };
}
