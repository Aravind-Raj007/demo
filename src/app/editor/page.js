'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Play, Pause, RotateCcw } from 'lucide-react';
import { TEMPLATES } from '@/data/templates';
import Timeline from '@/components/Timeline';
import Canvas from '@/components/Canvas';
import LayersPanel from '@/components/LayersPanel';
import PropertiesPanel from '@/components/PropertiesPanel';
import { cn } from '@/lib/utils';


export default function EditorPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  
  // Editor State
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [layers, setLayers] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [zoom, setZoom] = useState(0.8);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef();
  const startTimeRef = useRef();

  // Load template
  useEffect(() => {
    if (templateId) {
      const template = TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setActiveTemplate(template);
        setLayers(JSON.parse(JSON.stringify(template.layers))); // Deep copy
      }
    } else {
      // Default to first template
      const template = TEMPLATES[0];
      setActiveTemplate(template);
      setLayers(JSON.parse(JSON.stringify(template.layers)));
    }
  }, [templateId]);

  // Playback Logic
  const animate = useCallback((time) => {
    if (!activeTemplate) return;
    
    if (startTimeRef.current === undefined) {
      startTimeRef.current = time;
    }
    
    const deltaTime = (time - startTimeRef.current) / 1000; // Convert to seconds
    
    // Calculate new time based on previous time + delta would be better for pausing
    // But for simple loop, we'll just increment
    setCurrentTime(prevTime => {
      const newTime = prevTime + 0.016; // Approx 60fps
      if (newTime >= activeTemplate.duration) {
        setIsPlaying(false);
        return 0;
      }
      return newTime;
    });

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, activeTemplate]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      startTimeRef.current = undefined;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate]);

  // Layer Management
  const handleUpdateLayer = (id, updates) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };

  const handleDeleteLayer = (id) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleExport = async () => {
    if (!activeTemplate) return;
    setIsExporting(true);
    
    // Pause playback and reset zoom for consistent capture
    setIsPlaying(false);
    const previousZoom = zoom;
    setZoom(1);
    
    // Wait for zoom to apply (React render)
    await new Promise(r => setTimeout(r, 100));

    try {
      // Dynamically import to avoid SSR issues with html2canvas/webcodecs
      const { renderAndExport } = await import('@/utils/VideoExporter');
      
      await renderAndExport({
        width: 1920,
        height: 1080,
        duration: activeTemplate.duration,
        fps: 30,
        seekTo: (time) => setCurrentTime(time),
        canvasId: 'export-canvas-container', // Target the high-res canvas
        onProgress: (p) => {

        }
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. See console for details.");
    } finally {
      setIsExporting(false);
      setCurrentTime(0); // Reset after export
      setZoom(previousZoom); // Restore zoom
    }
  };

  if (!activeTemplate) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold text-sm">{activeTemplate.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-4 font-mono">
            {currentTime.toFixed(2)}s / {activeTemplate.duration}s
          </div>
          <button 
            onClick={() => {
              const data = JSON.stringify({ ...activeTemplate, layers }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeTemplate.name.toLowerCase().replace(/\s+/g, '-')}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 mr-2"
          >
            Save JSON
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <><Download className="w-3 h-3" /> Export Video</>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers */}
        <div className="w-64 border-r border-border bg-card">
          <LayersPanel 
            layers={layers}
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
            onUpdateLayer={handleUpdateLayer}
            onDeleteLayer={handleDeleteLayer}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 bg-muted flex flex-col relative">
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            <div ref={canvasRef} id="canvas-container">
              <Canvas 
                width={640}
                height={360}
                zoom={zoom}
                layers={layers}
                currentTime={currentTime}
                selectedLayerId={selectedLayerId}
                onLayerUpdate={handleUpdateLayer}
                isExporting={isExporting}
              />
            </div>
          </div>
          
          {/* Export Overlay & Canvas */}
          {isExporting && (
            <>
              {/* Full Screen Overlay to hide the process */}
              <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold mb-4">Exporting Video...</div>
                <div className="text-muted-foreground">Please wait while we render your ad.</div>
              </div>

              {/* High-Res Canvas for Export - Hidden behind overlay but rendered */}
              <div 
                id="export-canvas-container" 
                style={{ 
                  position: 'fixed', 
                  left: '0', 
                  top: '0',
                  width: '1920px',
                  height: '1080px',
                  zIndex: 50, // Behind overlay (9999) but above editor (to ensure paint)
                  visibility: 'visible',
                  pointerEvents: 'none'
                }}
              >
                 <Canvas 
                    width={1920}
                    height={1080}
                    zoom={1}
                    layers={layers}
                    currentTime={currentTime}
                    selectedLayerId={null}
                    onLayerUpdate={() => {}}
                    isExporting={true}
                    resolutionScale={3}
                  />
              </div>
            </>
          )}

          {/* Timeline Controls */}
          <div className="h-12 border-t border-border bg-card flex items-center justify-center gap-4 px-4">
            <button 
              className="p-2 hover:bg-muted rounded-full"
              onClick={() => setCurrentTime(0)}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              className="p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max={activeTemplate.duration} 
              step="0.01"
              value={currentTime}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
              className="w-64 accent-primary"
            />
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="text-xs bg-muted px-2 py-1 rounded">-</button>
              <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="text-xs bg-muted px-2 py-1 rounded">+</button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l border-border bg-card">
          <PropertiesPanel 
            selectedLayer={selectedLayer}
            onUpdateLayer={handleUpdateLayer}
          />
        </div>
      </div>

      {/* Bottom - Timeline */}
      <div className="h-64 border-t border-border bg-card">
        <Timeline 
          duration={activeTemplate.duration}
          currentTime={currentTime}
          setCurrentTime={(t) => {
            setIsPlaying(false);
            setCurrentTime(t);
          }}
          layers={layers}
          selectedLayerId={selectedLayerId}
          setSelectedLayerId={setSelectedLayerId}
          onLayerUpdate={handleUpdateLayer}
        />
      </div>
    </div>
  );
}
