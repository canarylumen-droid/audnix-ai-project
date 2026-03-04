import { useEffect, useRef } from 'react';
import { useRealtime } from '@/hooks/use-realtime';

export function NotificationSound() {
    const { socket } = useRealtime();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element
        const audio = new Audio('/notification-sound.mp3');
        audioRef.current = audio;

        if (!socket) return;

        const handleNotification = (data: any) => {
            if (data?.playSound) {
                audioRef.current?.play().catch(err => {
                    console.warn('Click anywhere on the page to enable notification sounds.', err);
                });
            }
        };

        socket.on('notification', handleNotification);
        socket.on('message_received', (data: any) => {
            // Always play sound for received messages
            audioRef.current?.play().catch(() => { });
        });

        return () => {
            socket.off('notification', handleNotification);
            socket.off('message_received');
        };
    }, [socket]);

    return null;
}
