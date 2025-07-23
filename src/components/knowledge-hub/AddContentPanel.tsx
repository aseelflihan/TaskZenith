"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getFileExtension } from "@/lib/file-utils";
import { Loader2, Plus, Upload, FileText, Image as ImageIcon, FileVideo, Table, Monitor, Eye } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { KnowledgeItem } from "@/lib/types";
import Image from "next/image";

export function AddContentPanel() {
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItem, setSelectedItem } = useKnowledgeHubStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000); // Hide error after 8 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setContent(""); // Clear text content when file is selected
      setError(null); // Clear error on new file selection
      
      // Generate image preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      let response;
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        response = await fetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
      }

      if (response.ok) {
        const newItem = await response.json();
        addItem(newItem as KnowledgeItem);
        setSelectedItem(newItem as KnowledgeItem);
        setContent("");
        handleClearFile();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || "An unknown error occurred.";
        setError(errorMessage);
        console.error("Failed to add item:", errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      console.error("Error submitting item:", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Add to Knowledge Hub</h2>
      
      {/* File Upload Section */}
      <div className="mb-4">
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.xlsx,.xls,.pptx,.ppt,.csv"
          className="hidden"
          disabled={isProcessing}
        />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                {getFileIcon(selectedFile)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {getFileExtension(selectedFile.name, selectedFile.type).toUpperCase()}
                </p>
                {selectedFile.type.startsWith('image/') && (
                  <div className="flex items-center gap-1 mt-1">
                    <Eye className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Ready for OCR text extraction
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFile}
                disabled={isProcessing}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                ✕
              </Button>
            </div>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="ocr-preview-container p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Image Preview</span>
                  </div>
                  <div className="ocr-status-badge">
                    <Eye className="h-3 w-3" />
                    OCR Ready
                  </div>
                </div>
                <div className="relative w-full h-48 rounded-md overflow-hidden bg-muted/50">
                  <Image
                    src={imagePreview}
                    alt="Image preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Text will be automatically extracted using AI-powered OCR
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
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
          disabled={isProcessing || !!selectedFile}
        />
      </div>

      {error && (
        <div className="error-panel">
          <p className="font-semibold">Upload Failed</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Processing Status for Images */}
      {isProcessing && selectedFile?.type.startsWith('image/') && (
        <div className="processing-indicator mb-4">
          <Loader2 className="spinner" />
          <span className="text-sm font-medium">
            Extracting text from image using AI-powered OCR...
          </span>
        </div>
      )}
      
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || (!content.trim() && !selectedFile)}
        className="mt-4 w-full h-12 text-base font-medium"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {selectedFile?.type.startsWith('image/') 
              ? "Extracting Text with OCR..." 
              : selectedFile 
                ? "Processing File..." 
                : "Analyzing..."}
          </>
        ) : (
          <>
            <Plus className="mr-2 h-5 w-5" />
            Add to Knowledge Hub
          </>
        )}
      </Button>
    </div>
  );
}