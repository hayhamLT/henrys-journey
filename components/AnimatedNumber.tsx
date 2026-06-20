
import React, { useState, useEffect, useRef } from 'react';

const easeOutCubic = (t: number): number => (--t) * t * t + 1;

interface AnimatedNumberProps {
  value: number;
  startValue?: number;
  format?: (value: number) => string | number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, startValue: propStartValue, format }) => {
  const [displayValue, setDisplayValue] = useState(propStartValue !== undefined ? propStartValue : value);
  const animationFrameRef = useRef<number | null>(null);
  const displayValueRef = useRef(displayValue);

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    // If a startValue is provided, the animation should start from it. Otherwise, it should start from the currently displayed value.
    const startAnimationValue = propStartValue !== undefined ? propStartValue : displayValueRef.current;
    
    // If we're already at the target value, no need to animate.
    if (displayValueRef.current === value && startAnimationValue === value) {
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1200; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const currentNumber = (easedProgress * (value - startAnimationValue) + startAnimationValue);
      setDisplayValue(currentNumber);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, propStartValue]);

  // Round for display to avoid ugly decimals during animation, unless custom format handles it
  const display = format ? format(displayValue) : Math.round(displayValue).toLocaleString();

  return <>{display}</>;
};

export default AnimatedNumber;
