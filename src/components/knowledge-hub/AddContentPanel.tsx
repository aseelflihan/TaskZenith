"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getFileExtension } from "@/lib/file-utils";
import { Loader2, Plus, Upload, FileText, Image as ImageIcon, FileVideo, Table, Monitor, Eye, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Lottie from "lottie-react";
import animationData from "@/assets/animations/Animation_loading.json";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { KnowledgeItem } from "@/lib/types";
import Image from "next/image";

interface UploadableFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  controller: AbortController;
}

export function AddContentPanel() {
  const [content, setContent] = useState("");
  const [uploadQueue, setUploadQueue] = useState<UploadableFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItem, setSelectedItem } = useKnowledgeHubStore();

  const isUploading = uploadQueue.some(item => item.status === 'uploading');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newUploads: UploadableFile[] = Array.from(files).map(file => ({
        id: `${file.name}-${file.lastModified}-${file.size}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0,
        controller: new AbortController(),
      }));
      setUploadQueue(prevQueue => [...prevQueue, ...newUploads]);
      setContent("");
      setError(null);
    }
  };

  const handleCancelUpload = (idToCancel: string) => {
    setUploadQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.id === idToCancel) {
          if (item.status === 'uploading') {
            item.controller.abort();
          }
          return { ...item, status: 'cancelled' };
        }
        return item;
      })
    );
  };

  const handleClearCompleted = () => {
    setUploadQueue(prevQueue => {
        const newQueue = prevQueue.filter(item => item.status === 'uploading' || item.status === 'pending');
        // If the queue is now empty, reset the file input to allow re-selection of the same files
        if (newQueue.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return newQueue;
    });
  };

  const handleRetryUpload = (idToRetry: string) => {
    setUploadQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.id === idToRetry) {
          return {
            ...item,
            status: 'pending',
            progress: 0,
            error: undefined,
            controller: new AbortController(),
          };
        }
        return item;
      })
    );
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      return <Table className="h-4 w-4" />;
    }
    if (type.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) {
      return <Monitor className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const uploadFile = async (item: UploadableFile) => {
    setUploadQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
        signal: item.controller.signal,
      });

      if (response.ok) {
        const newItem = await response.json();
        addItem(newItem as KnowledgeItem);
        setSelectedItem(newItem as KnowledgeItem);
        setUploadQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', progress: 100 } : i));
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || "An unknown error occurred.";
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`Upload cancelled for ${item.file.name}`);
        // Status is already set to 'cancelled' by handleCancelUpload
      } else {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error(`Error uploading ${item.file.name}:`, errorMessage);
        setUploadQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: errorMessage } : i));
      }
    }
  };

  const handleSubmit = async () => {
    if (content.trim()) {
        // Handle text submission
        const response = await fetch('/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        if (response.ok) {
            const newItem = await response.json();
            addItem(newItem as KnowledgeItem);
            setSelectedItem(newItem as KnowledgeItem);
            setContent("");
        } else {
            const errorData = await response.json();
            setError(errorData.details || errorData.error || "An unknown error occurred.");
        }
    } else {
        // Handle file submissions
        const pendingUploads = uploadQueue.filter(item => item.status === 'pending');
        const uploadPromises = pendingUploads.map(item => uploadFile(item));
        await Promise.allSettled(uploadPromises);
    }
  };

  const getProcessingButtonText = () => {
    const uploadingCount = uploadQueue.filter(item => item.status === 'uploading').length;
    if (uploadingCount > 0) {
        return `Uploading ${uploadingCount} file(s)...`;
    }
    const pendingCount = uploadQueue.filter(item => item.status === 'pending').length;
    if (pendingCount > 0) {
        return `Upload ${pendingCount} file(s)`;
    }
    return "Add to Hub";
  };

  return (
    <div className="p-4 bg-transparent backdrop-blur-sm h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Add Content</h2>
      
      {/* File Upload Section */}
      <div className="mb-4">
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.xlsx,.xls,.pptx,.ppt,.csv"
          className="hidden"
          disabled={isUploading}
        />
        
        {uploadQueue.length > 0 ? (
          <div className="space-y-2">
            {uploadQueue.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {getFileIcon(item.file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024).toFixed(1)} KB - <span className={`font-semibold ${
                      item.status === 'success' ? 'text-green-500' :
                      item.status === 'error' ? 'text-red-500' :
                      item.status === 'cancelled' ? 'text-yellow-500' :
                      'text-muted-foreground'
                    }`}>{item.status}</span>
                  </p>
                  {item.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${item.progress}%`}}></div>
                    </div>
                  )}
                  {item.status === 'error' && <p className="text-xs text-red-500 truncate">{item.error}</p>}
                </div>
                {item.status === 'pending' && (
                    <Button variant="ghost" size="sm" onClick={() => handleCancelUpload(item.id)} disabled={isUploading} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">✕</Button>
                )}
                {item.status === 'uploading' && (
                    <Button variant="ghost" size="sm" onClick={() => handleCancelUpload(item.id)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">✕</Button>
                )}
                 {item.status === 'error' && (
                    <Button variant="ghost" size="sm" onClick={() => handleRetryUpload(item.id)} disabled={isUploading} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">↻</Button>
                )}
              </div>
            ))}
             {(uploadQueue.some(i => i.status === 'success' || i.status === 'error' || i.status === 'cancelled')) && (
                <Button onClick={handleClearCompleted} variant="link" size="sm" className="w-full">Clear completed</Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-auto py-4 flex flex-col gap-2 border-2 border-dashed hover:border-primary/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Upload File</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  All file types supported
                </p>
              </div>
            </Button>
            
            {/* File Type Icons */}
            <div className="flex justify-center gap-4 py-2">
              <div className="flex flex-col items-center gap-1">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">PDF/DOC</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="h-5 w-5 text-green-500" />
                <span className="text-xs text-muted-foreground">Images</span>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">OCR Ready</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <FileVideo className="h-5 w-5 text-purple-500" />
                <span className="text-xs text-muted-foreground">Videos</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Table className="h-5 w-5 text-orange-500" />
                <span className="text-xs text-muted-foreground">Excel</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Text Input Section */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px bg-border flex-1"></div>
          <p className="text-sm text-muted-foreground">Or add text content</p>
          <div className="h-px bg-border flex-1"></div>
        </div>
        <Textarea
          placeholder="Drop a link, a paragraph, or just a thought..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-transparent resize-none border-2 border-dashed hover:border-primary/50 transition-colors"
          rows={5}
          disabled={isUploading || uploadQueue.length > 0}
        />
      </div>

      {error && (
        <div className="error-panel">
          <p className="font-semibold">Upload Failed</p>
          <p>{error}</p>
        </div>
      )}
      
      <Button
        onClick={handleSubmit}
        disabled={isUploading || (!content.trim() && uploadQueue.filter(i => i.status === 'pending').length === 0)}
        className="mt-4 w-full h-12 text-base font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
        size="lg"
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <Lottie
              animationData={animationData}
              loop={true}
              style={{ width: 40, height: 40 }}
              className="mr-2"
            />
            <span className="font-medium tracking-wide">{getProcessingButtonText()}</span>
          </div>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            {getProcessingButtonText()}
          </>
        )}
      </Button>
    </div>
  );
}