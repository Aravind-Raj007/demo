'use client';

import React from 'react';
import { Layers, Image as ImageIcon, Type, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LayersPanel({ 
  layers, 
  selectedLayerId, 
  setSelectedLayerId,
  onUpdateLayer,
  onDeleteLayer
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border font-medium text-xs flex items-center gap-2 bg-muted/10">
        <Layers className="w-3 h-3" /> Layers
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.slice().reverse().map((layer, index) => (
          <div 
            key={layer.id}
            onClick={() => setSelectedLayerId(layer.id)}
            className={cn(
              "group flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer hover:bg-muted transition-colors border border-transparent select-none",
              selectedLayerId === layer.id && "bg-muted border-primary/20 shadow-sm"
            )}
          >
            <GripVertical className="w-3 h-3 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center text-muted-foreground">
              {layer.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Type className="w-3 h-3" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{layer.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                {layer.type} • {layer.start}s - {layer.end}s
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();

                }}
              >
                <Eye className="w-3 h-3" />
              </button>
              <button 
                className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {layers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No layers added yet.
          </div>
        )}
      </div>
    </div>
  );
}
