import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase || !userId) return;

    // Subscribe to leads table changes
    const leadsChannel = supabase
      .channel(`leads-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Lead change:', payload);
          
          // Invalidate leads queries
          queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
          queryClient.invalidateQueries({ queryKey: ['/api/leads/stats'] });
          
          // Show notification for new leads
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Lead Captured',
              description: `${payload.new.name} from ${payload.new.channel}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to messages table changes
    const messagesChannel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          
          // Invalidate conversation queries
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          queryClient.invalidateQueries({ queryKey: [`/api/conversations/${payload.new.lead_id}`] });
          
          // Show notification for inbound messages
          if (payload.new.direction === 'inbound') {
            toast({
              title: 'New Message',
              description: 'You have a new message from a lead',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to integrations table changes
    const integrationsChannel = supabase
      .channel(`integrations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Integration change:', payload);
          
          // Invalidate integrations queries
          queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
          
          // Show notification for connection status changes
          if (payload.eventType === 'UPDATE') {
            const wasActive = payload.old.is_active;
            const isActive = payload.new.is_active;
            
            if (!wasActive && isActive) {
              toast({
                title: 'Integration Connected',
                description: `${payload.new.provider} has been connected successfully`,
              });
            } else if (wasActive && !isActive) {
              toast({
                title: 'Integration Disconnected',
                description: `${payload.new.provider} has been disconnected`,
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to follow-up queue changes
    const queueChannel = supabase
      .channel(`queue-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follow_up_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Queue change:', payload);
          
          // Invalidate queue queries
          queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
          
          // Show notification for completed follow-ups
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
            toast({
              title: 'Follow-up Sent',
              description: 'AI has sent a follow-up message to your lead',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to notifications table
    const notificationsChannel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification:', payload);
          
          // Invalidate notifications queries
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          
          // Show the notification
          toast({
            title: payload.new.title,
            description: payload.new.message,
            variant: payload.new.type === 'billing_issue' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(integrationsChannel);
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [userId, queryClient, toast]);
}

// Hook to use in dashboard layout
export function useDashboardRealtime() {
  // Get current user ID from your auth context or storage
  // For now, using a placeholder - replace with actual user ID
  const userId = localStorage.getItem('userId') || undefined;
  
  useRealtime(userId);
}