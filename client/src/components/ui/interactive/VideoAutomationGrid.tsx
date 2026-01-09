import React from 'react';
import { cn } from '@/lib/utils';

export function VideoGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    {/* Thumbnail Skeleton */}
                    <div className="relative w-full aspect-video rounded-xl bg-muted/40 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </div>

                    {/* Content Skeleton */}
                    <div className="space-y-2">
                        {/* Title */}
                        <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
                        {/* Channel Name */}
                        <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                        {/* Meta */}
                        <div className="h-3 w-1/3 bg-muted/20 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface VideoMetadata {
    id: string;
    thumbnail: string;
    title: string;
    channel: string;
    views: string;
    postedAt: string;
}

interface VideoAutomationGridProps {
    loading?: boolean;
    videos?: VideoMetadata[];
    onSelect?: (video: VideoMetadata) => void;
}

const DEMO_VIDEOS: VideoMetadata[] = [
    {
        id: '1',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
        title: 'Instagram Reels Mastery 2024',
        channel: 'Creator Academy',
        views: '1.2M views',
        postedAt: '2 days ago'
    },
    {
        id: '2',
        thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80',
        title: 'Viral Hook Strategy Breakdown',
        channel: 'Growth Hacks',
        views: '450K views',
        postedAt: '1 week ago'
    },
    {
        id: '3',
        thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
        title: 'Automated Sales Funnel Setup',
        channel: 'Tech Talk',
        views: '89K views',
        postedAt: '3 weeks ago'
    }
];

export function VideoAutomationGrid({
    loading = false,
    videos = DEMO_VIDEOS,
    onSelect
}: VideoAutomationGridProps) {
    if (loading) {
        return <VideoGridSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <div
                    key={video.id}
                    className="group cursor-pointer space-y-3"
                    onClick={() => onSelect?.(video)}
                >
                    {/* Thumbnail Container */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_-10px_rgba(var(--primary-rgb),0.3)]">
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                            </div>
                        </div>
                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-medium text-white">
                            12:45
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium leading-none group-hover:text-primary transition-colors line-clamp-2">
                            {video.title}
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                {video.channel}
                            </span>
                            <span className="text-xs text-muted-foreground/60">
                                {video.views} • {video.postedAt}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
