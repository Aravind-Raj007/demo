'use client';

import React from 'react';
import { Settings, AlignLeft, AlignCenter, AlignRight, Type, Clock, Move } from 'lucide-react';
import { ANIMATIONS } from '@/data/animations';

export default function PropertiesPanel({ 
  selectedLayer, 
  onUpdateLayer 
}) {
  if (!selectedLayer) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border font-medium text-xs flex items-center gap-2 bg-muted/10">
          <Settings className="w-3 h-3" /> Properties
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs p-8 text-center">
          Select a layer to edit its properties
        </div>
      </div>
    );
  }

  const handleChange = (key, value) => {
    onUpdateLayer(selectedLayer.id, { [key]: value });
  };

  const handleStyleChange = (key, value) => {
    onUpdateLayer(selectedLayer.id, { 
      style: { ...selectedLayer.style, [key]: value } 
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-border font-medium text-xs flex items-center gap-2 bg-muted/10">
        <Settings className="w-3 h-3" /> Properties
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Layer Name</label>
          <input 
            type="text" 
            value={selectedLayer.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Content (Text only) */}
        {selectedLayer.type === 'text' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Type className="w-3 h-3" /> Content
            </label>
            <textarea 
              value={selectedLayer.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary min-h-[60px]"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Font Size</label>
                <input 
                  type="number" 
                  value={selectedLayer.style.fontSize}
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                  className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={selectedLayer.style.color}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border p-0.5 bg-background"
                  />
                  <input 
                    type="text" 
                    value={selectedLayer.style.color}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timing */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Timing (seconds)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Start</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={selectedLayer.start}
                onChange={(e) => handleChange('start', parseFloat(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">End</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={selectedLayer.end}
                onChange={(e) => handleChange('end', parseFloat(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Position */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Move className="w-3 h-3" /> Position (%)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">X Axis</label>
              <input 
                type="number" 
                value={selectedLayer.style.x}
                onChange={(e) => handleStyleChange('x', parseFloat(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Y Axis</label>
              <input 
                type="number" 
                value={selectedLayer.style.y}
                onChange={(e) => handleStyleChange('y', parseFloat(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Animation */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Animation</label>
          <select 
            value={selectedLayer.animation || 'none'}
            onChange={(e) => handleChange('animation', e.target.value)}
            className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
          >
            {Object.entries(ANIMATIONS).map(([key, anim]) => (
              <option key={key} value={key}>{anim.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
