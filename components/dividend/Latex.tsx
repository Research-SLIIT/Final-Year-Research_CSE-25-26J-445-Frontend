'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexProps {
  children: string;
  block?: boolean;
}

const Latex: React.FC<LatexProps> = ({ children, block = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && children) {
      // Clean the string - remove starting/ending $$ or $ and trim whitespace
      const cleanLatex = children
        .replace(/^\$+/, '')  // Remove leading $
        .replace(/\$+$/, '')  // Remove trailing $
        .trim();              // Remove extra spaces
    
      console.log("Original equation:", children);
      console.log("Cleaned LaTeX:", cleanLatex);
      console.log("Block mode:", block);

      if (!cleanLatex) {
        console.warn("Empty LaTeX string after cleaning");
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span style="color: orange;">Empty equation</span>`;
        }
        return;
      }

      try {
        // Render with KaTeX
        katex.render(cleanLatex, containerRef.current, {
          throwOnError: false,
          displayMode: block,
          trust: false,
          strict: false,
          output: 'html',
        });
        console.log("KaTeX rendered successfully");
      } catch (error) {
        console.error("KaTeX Rendering Error:", error);
        // Show the error in the UI
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span style="color: red;">LaTeX Error: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
        }
      }
    } else if (!children) {
      console.warn("No children passed to Latex component");
    }
  }, [children, block]);

  // Use div for block mode, span for inline
  if (block) {
    return (
      <div 
        ref={containerRef} 
        className="katex-display" 
        style={{ 
          fontSize: '1.2em',
          color: 'inherit',
          minHeight: '2em'
        }} 
      />
    );
  }
  
  return <div ref={containerRef} className="katex-inline" style={{ color: 'inherit' }} />;
};

export default Latex;