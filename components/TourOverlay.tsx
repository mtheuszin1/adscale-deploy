
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TourOverlayProps {
  steps: TourStep[];
  onComplete: () => void;
  onCancel: () => void;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ steps, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    const updatePosition = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, step.targetId]);

  if (!targetRect) return null;

  // Fix: Construct the entire style object at once to avoid "Property does not exist on type CSSProperties" errors during mutation.
  const tooltipStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 110,
    transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
    ...(step.position === 'bottom' ? {
      top: targetRect.bottom + 20,
      left: targetRect.left + targetRect.width / 2,
      transform: 'translateX(-50%)',
    } : step.position === 'top' ? {
      top: targetRect.top - 200,
      left: targetRect.left + targetRect.width / 2,
      transform: 'translateX(-50%)',
    } : step.position === 'right' ? {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.right + 20,
      transform: 'translateY(-50%)',
    } : {
      // Defaulting to 'left' position
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left - 320,
      transform: 'translateY(-50%)',
    })
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dimmed Background with Hole */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={targetRect.left - 10} 
              y={targetRect.top - 10} 
              width={targetRect.width + 20} 
              height={targetRect.height + 20} 
              rx="24" 
              fill="black" 
              className="transition-all duration-500"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(2, 6, 23, 0.85)" mask="url(#tour-mask)" className="pointer-events-auto" />
      </svg>

      {/* Focus Ring */}
      <div 
        className="absolute border-4 border-blue-500 rounded-[28px] shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all duration-500 animate-pulse z-[105]"
        style={{
          top: targetRect.top - 12,
          left: targetRect.left - 12,
          width: targetRect.width + 24,
          height: targetRect.height + 24,
        }}
      />

      {/* Tooltip Card */}
      <div 
        style={tooltipStyles}
        className="w-80 bg-[#0f172a] border border-blue-500/30 rounded-[32px] p-8 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Tour {currentStep + 1}/{steps.length}</span>
           </div>
           <button onClick={onCancel} className="text-slate-600 hover:text-white transition-colors">
              <X size={18} />
           </button>
        </div>

        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter mb-3 leading-none">{step.title}</h3>
        <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic mb-8 opacity-80">{step.content}</p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-6 bg-blue-500' : 'w-2 bg-slate-800'}`} />
            ))}
          </div>
          
          <div className="flex gap-2">
             {currentStep > 0 && (
               <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"
               >
                 <ChevronLeft size={18} />
               </button>
             )}
             <button 
              onClick={() => currentStep < steps.length - 1 ? setCurrentStep(currentStep + 1) : onComplete()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
             >
               {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'} 
               {currentStep === steps.length - 1 ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
