export const ANIMATIONS = {
  none: {
    name: 'None',
    initial: {},
    animate: {},
    exit: {},
  },
  fadeIn: {
    name: 'Fade In',
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideInLeft: {
    name: 'Slide In Left',
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },
  slideInRight: {
    name: 'Slide In Right',
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
  },
  slideInTop: {
    name: 'Slide In Top',
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 },
  },
  slideInBottom: {
    name: 'Slide In Bottom',
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 },
  },
  zoomIn: {
    name: 'Zoom In',
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  zoomOut: {
    name: 'Zoom Out',
    initial: { scale: 1.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 },
  },
  bounceIn: {
    name: 'Bounce In',
    initial: { scale: 0.3, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 260, damping: 20 } 
    },
    exit: { scale: 0.3, opacity: 0 },
  },
  rotateIn: {
    name: 'Rotate In',
    initial: { rotate: -180, opacity: 0, scale: 0.5 },
    animate: { rotate: 0, opacity: 1, scale: 1 },
    exit: { rotate: -180, opacity: 0, scale: 0.5 },
  },
  blurIn: {
    name: 'Blur In',
    initial: { filter: 'blur(10px)', opacity: 0 },
    animate: { filter: 'blur(0px)', opacity: 1 },
    exit: { filter: 'blur(10px)', opacity: 0 },
  },
  elasticPop: {
    name: 'Elastic Pop',
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    exit: { scale: 0, opacity: 0 },
  },
  slideInDiagonal: {
    name: 'Slide In Diagonal',
    initial: { x: -100, y: -100, opacity: 0 },
    animate: { x: 0, y: 0, opacity: 1 },
    exit: { x: -100, y: -100, opacity: 0 },
  },
  flipInX: {
    name: 'Flip In X',
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: 90, opacity: 0 },
  },
  flipInY: {
    name: 'Flip In Y',
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 },
  },
  swing: {
    name: 'Swing',
    initial: { rotate: 15, opacity: 0 },
    animate: { 
      rotate: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 10 }
    },
    exit: { rotate: 15, opacity: 0 },
  },
  heartbeat: {
    name: 'Heartbeat',
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { repeat: Infinity, repeatType: "reverse", duration: 0.8 }
    },
    exit: { scale: 0.8, opacity: 0 },
  },
  wobble: {
    name: 'Wobble',
    initial: { x: -20, rotate: -5, opacity: 0 },
    animate: { 
      x: 0, 
      rotate: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 10 }
    },
    exit: { x: -20, rotate: -5, opacity: 0 },
  },
};
