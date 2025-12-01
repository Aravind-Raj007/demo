'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIMATIONS } from '@/data/animations';

// Helper to interpolate values based on progress (0 to 1)
const interpolate = (start, end, progress) => {
  return start + (end - start) * progress;
};

// Helper to get current animation styles
const getAnimationStyles = (animationName, progress) => {
  const anim = ANIMATIONS[animationName] || ANIMATIONS.none;
  
  // If no animation or progress is complete (1), return final state
  if (progress >= 1) return anim.animate;
  if (progress <= 0) return anim.initial;


  
  const style = {};
  
  // Interpolate Opacity
  if (anim.initial.opacity !== undefined && anim.animate.opacity !== undefined) {
    style.opacity = interpolate(anim.initial.opacity, anim.animate.opacity, progress);
  }

  // Interpolate Scale
  if (anim.initial.scale !== undefined && anim.animate.scale !== undefined) {
    style.scale = interpolate(anim.initial.scale, anim.animate.scale, progress);
  }

  // Interpolate Transforms (x, y, rotate, rotateX, rotateY)
  const x = interpolate(anim.initial.x || 0, anim.animate.x || 0, progress);
  const y = interpolate(anim.initial.y || 0, anim.animate.y || 0, progress);
  const rotate = interpolate(anim.initial.rotate || 0, anim.animate.rotate || 0, progress);
  const rotateX = interpolate(anim.initial.rotateX || 0, anim.animate.rotateX || 0, progress);
  const rotateY = interpolate(anim.initial.rotateY || 0, anim.animate.rotateY || 0, progress);
  
  style.x = x;
  style.y = y;
  if (rotate !== 0) style.rotate = rotate;
  if (rotateX !== 0) style.rotateX = rotateX;
  if (rotateY !== 0) style.rotateY = rotateY;

  // Interpolate Filter (blur)

  if (anim.initial.filter !== undefined && anim.animate.filter !== undefined) {
    const startBlur = parseFloat(anim.initial.filter.replace('blur(', '').replace('px)', '')) || 0;
    const endBlur = parseFloat(anim.animate.filter.replace('blur(', '').replace('px)', '')) || 0;
    const currentBlur = interpolate(startBlur, endBlur, progress);
    if (currentBlur > 0) {
      style.filter = `blur(${currentBlur}px)`;
    }
  }

  return style;
};

export default function Canvas({ 
  width = 640, 
  height = 360, 
  zoom = 1, 
  layers, 
  currentTime,
  selectedLayerId,
  onLayerUpdate,
  isExporting = false,
  resolutionScale = 1
}) {
  const containerRef = React.useRef(null);
  const [draggingLayer, setDraggingLayer] = React.useState(null);
  const dragStartRef = React.useRef(null);

  // Handle mouse down to start drag
  const handleMouseDown = (e, layer) => {
    if (isExporting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setDraggingLayer(layer.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      layerX: layer.style.x || 0,
      layerY: layer.style.y || 0
    };
  };

  // Handle mouse move during drag
  React.useEffect(() => {
    if (!draggingLayer || !dragStartRef.current || !containerRef.current) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const canvasWidth = containerRect.width / zoom;
      const canvasHeight = containerRect.height / zoom;
      
      const deltaXPercent = (deltaX / canvasWidth) * 100;
      const deltaYPercent = (deltaY / canvasHeight) * 100;
      
      onLayerUpdate(draggingLayer, {
        style: {
          ...layers.find(l => l.id === draggingLayer)?.style,
          x: dragStartRef.current.layerX + deltaXPercent,
          y: dragStartRef.current.layerY + deltaYPercent
        }
      });
    };

    const handleMouseUp = () => {
      setDraggingLayer(null);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingLayer, zoom, layers, onLayerUpdate]);

  // Helper to scale pixel values
  const s = (val) => typeof val === 'number' ? val * resolutionScale : val;
  // Helper to scale string values with px (e.g. "10px 20px")
  const sp = (val) => {
    if (typeof val !== 'string') return val;
    return val.replace(/(\d+(\.\d+)?)px/g, (match, num) => `${parseFloat(num) * resolutionScale}px`);
  };

  return (
    <div 
      ref={containerRef}
      className="bg-white shadow-2xl relative overflow-hidden origin-center"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: isExporting ? 'none' : `scale(${zoom})`,
        transition: isExporting ? 'none' : 'transform 0.1s ease-out'
      }}
    >

      {!isExporting && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }} 
        />
      )}

      {layers.map((layer) => {

        const isVisible = currentTime >= layer.start && currentTime <= layer.end;
        if (!isVisible) return null;

        const animationDuration = 0.5;
        const timeSinceStart = currentTime - layer.start;
        const progress = Math.min(Math.max(timeSinceStart / animationDuration, 0), 1);
        
        const animStyles = getAnimationStyles(layer.animation, progress);

        // For export, we bypass framer-motion to ensure exact style application
        // without relying on component mounting animations or time-slicing
        if (isExporting) {
          return (
            <div
              key={layer.id}
              className="absolute"
              style={{
                left: `${layer.style.x}%`,
                top: `${layer.style.y}%`,
                width: layer.style.width ? `${layer.style.width}%` : 'auto',
                height: layer.style.height ? `${layer.style.height}%` : 'auto',
                zIndex: layer.style.zIndex,
                // Apply interpolated styles directly
                opacity: animStyles.opacity !== undefined ? animStyles.opacity : 1,
                filter: animStyles.filter || 'none',
                transform: `
                  scale(${animStyles.scale !== undefined ? animStyles.scale : 1}) 
                  translate(${animStyles.x || 0}px, ${animStyles.y || 0}px)
                  rotate(${animStyles.rotate || 0}deg)
                  rotateX(${animStyles.rotateX || 0}deg)
                  rotateY(${animStyles.rotateY || 0}deg)
                `,
                perspective: '1000px' // Add perspective for 3D effects
              }}
            >
              {layer.type === 'image' && (
                <img 
                  src={layer.src} 
                  alt={layer.name}
                  className="w-full h-full object-cover pointer-events-none"
                  style={{ opacity: layer.style.opacity }}
                />
              )}
              
              {layer.type === 'text' && (
                <div
                  style={{
                    fontSize: `${s(layer.style.fontSize)}px`,
                    color: layer.style.color,
                    fontWeight: layer.style.fontWeight,
                    backgroundColor: layer.style.backgroundColor,
                    padding: sp(layer.style.padding),
                    borderRadius: sp(layer.style.borderRadius),
                    fontFamily: layer.style.fontFamily,
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {layer.content}
                </div>
              )}
            </div>
          );
        }

        // For draggable elements, exclude x/y from animation to avoid transform conflicts
        const { x: _x, y: _y, ...animStylesWithoutXY } = animStyles;

        return (
          <motion.div
            key={layer.id}
            initial={false}
            animate={animStylesWithoutXY}
            transition={{ duration: 0 }}
            
            className={`absolute ${!isExporting ? 'cursor-move' : ''}`}
            style={{
              left: `${layer.style.x}%`,
              top: `${layer.style.y}%`,
              width: layer.style.width ? `${layer.style.width}%` : 'auto',
              height: layer.style.height ? `${layer.style.height}%` : 'auto',
              zIndex: layer.style.zIndex,
              userSelect: 'none'
            }}
            onMouseDown={(e) => !isExporting && handleMouseDown(e, layer)}
          >
            {layer.type === 'image' && (
              <img 
                src={layer.src} 
                alt={layer.name}
                className="w-full h-full object-cover pointer-events-none"
                style={{ opacity: layer.style.opacity }}
              />
            )}
            
            {layer.type === 'text' && (
              <div
                style={{
                  fontSize: `${s(layer.style.fontSize)}px`,
                  color: layer.style.color,
                  fontWeight: layer.style.fontWeight,
                  backgroundColor: layer.style.backgroundColor,
                  padding: sp(layer.style.padding),
                  borderRadius: sp(layer.style.borderRadius),
                  fontFamily: layer.style.fontFamily,
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {layer.content}
              </div>
            )}

            {/* Selection Indicator */}
            {!isExporting && selectedLayerId === layer.id && (
              <div className="absolute inset-0 border-2 border-primary pointer-events-none -m-1" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
