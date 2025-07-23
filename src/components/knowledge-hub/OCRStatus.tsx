// OCR Status component for showing OCR processing status
"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';

interface OCRStatusProps {
  isProcessing: boolean;
  progress?: number;
  status?: 'idle' | 'preprocessing' | 'ocr' | 'enhancing' | 'complete' | 'error';
  error?: string;
}

export function OCRStatus({ isProcessing, progress = 0, status = 'idle', error }: OCRStatusProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setCurrentProgress(prev => {
          const newProgress = Math.min(prev + 2, progress);
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setCurrentProgress(0);
    }
  }, [isProcessing, progress]);

  if (!isProcessing && status === 'idle') {
    return null;
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'preprocessing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Preprocessing image...',
          color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
        };
      case 'ocr':
        return {
          icon: <Eye className="h-4 w-4" />,
          text: 'Extracting text with OCR...',
          color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
        };
      case 'enhancing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Enhancing text with AI...',
          color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'OCR completed successfully!',
          color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: error || 'OCR processing failed',
          color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
        };
      default:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Processing...',
          color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-3">
      <Badge className={`inline-flex items-center gap-2 px-3 py-2 ${statusInfo.color}`}>
        {statusInfo.icon}
        <span className="text-sm font-medium">{statusInfo.text}</span>
      </Badge>
      
      {isProcessing && status !== 'error' && (
        <div className="space-y-2">
          <Progress value={currentProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {currentProgress}% complete
          </div>
        </div>
      )}
    </div>
  );
}
