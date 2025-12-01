'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Timeline({ 
  duration, 
  currentTime, 
  setCurrentTime, 
  layers, 
  onLayerUpdate,
  selectedLayerId,
  setSelectedLayerId
}) {
  const timelineRef = useRef(null);

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setCurrentTime(percentage * duration);
  };

  const handleDragStart = (e, layer, type) => {
    e.stopPropagation();
    // Implementation for dragging clips would go here
    // For MVP, we'll stick to property panel editing for precision
  };

  return (
    <div className="flex flex-col h-full">
      {/* Time Ruler */}
      <div 
        className="h-8 border-b border-border bg-muted/20 relative cursor-pointer"
        onClick={handleTimelineClick}
        ref={timelineRef}
      >
        {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute top-0 bottom-0 border-l border-border/50 text-[10px] pl-1 text-muted-foreground select-none"
            style={{ left: `${(i / duration) * 100}%` }}
          >
            {i}s
          </div>
        ))}
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1 shadow-sm" />
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 bottom-0 border-l border-border/10"
              style={{ left: `${(i / duration) * 100}%` }}
            />
          ))}
        </div>

        <div className="py-2 space-y-1">
          {layers.map((layer) => (
            <div 
              key={layer.id} 
              className={cn(
                "h-10 relative group hover:bg-muted/30 transition-colors",
                selectedLayerId === layer.id && "bg-muted/50"
              )}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              {/* Track Content */}
              <div 
                className={cn(
                  "absolute top-1 bottom-1 rounded-md border text-xs flex items-center px-2 truncate cursor-move shadow-sm transition-all",
                  layer.type === 'text' ? "bg-blue-500/20 border-blue-500/50 text-blue-200" : "bg-purple-500/20 border-purple-500/50 text-purple-200",
                  selectedLayerId === layer.id && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
                style={{
                  left: `${(layer.start / duration) * 100}%`,
                  width: `${((layer.end - layer.start) / duration) * 100}%`
                }}
              >
                <span className="truncate">{layer.name}</span>
                
                {/* Resize Handles (Visual only for MVP) */}
                <div className="absolute left-0 top-0 bottom-0 w-1 cursor-w-resize hover:bg-white/50" />
                <div className="absolute right-0 top-0 bottom-0 w-1 cursor-e-resize hover:bg-white/50" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Playhead Line extending through tracks */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500/50 z-10 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>
    </div>
  );
}
