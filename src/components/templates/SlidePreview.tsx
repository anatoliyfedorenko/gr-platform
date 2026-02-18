'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SlidePreviewProps {
  slides: { title: string; text: string }[];
  onEditSlide?: (index: number, field: 'title' | 'text', value: string) => void;
  editable?: boolean;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({
  slides,
  onEditSlide,
  editable = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {slides.map((slide, index) => (
        <div key={index} className="group relative">
          {/* 16:9 aspect ratio container */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border border-gray-700">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />

            {/* Content */}
            <div className="relative h-full flex flex-col p-4 sm:p-6">
              {/* Title */}
              <div className="mb-3 flex-shrink-0">
                {editable ? (
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) =>
                      onEditSlide?.(index, 'title', e.target.value)
                    }
                    className={cn(
                      'w-full bg-transparent text-white text-sm sm:text-base font-bold',
                      'border-b border-transparent hover:border-slate-500 focus:border-blue-400',
                      'focus:outline-none transition-colors placeholder:text-slate-400',
                      'px-1 py-0.5'
                    )}
                    placeholder="Заголовок слайда"
                  />
                ) : (
                  <h3 className="text-white text-sm sm:text-base font-bold px-1">
                    {slide.title}
                  </h3>
                )}
              </div>

              {/* Body text */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {editable ? (
                  <textarea
                    value={slide.text}
                    onChange={(e) =>
                      onEditSlide?.(index, 'text', e.target.value)
                    }
                    className={cn(
                      'w-full h-full bg-transparent text-slate-200 text-xs sm:text-sm',
                      'border border-transparent rounded hover:border-slate-600 focus:border-blue-400',
                      'focus:outline-none transition-colors resize-none placeholder:text-slate-500',
                      'px-1 py-0.5'
                    )}
                    placeholder="Содержание слайда"
                  />
                ) : (
                  <p className="text-slate-200 text-xs sm:text-sm px-1 whitespace-pre-line line-clamp-6">
                    {slide.text}
                  </p>
                )}
              </div>

              {/* Slide number */}
              <div className="flex-shrink-0 mt-2">
                <span className="text-slate-400 text-xs font-medium">
                  {index + 1} / {slides.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
SlidePreview.displayName = 'SlidePreview';

export { SlidePreview };
