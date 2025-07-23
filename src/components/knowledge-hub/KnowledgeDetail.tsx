"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Eye, FileText, Calendar, User } from "lucide-react";
import TagsEditor from "./TagsEditor";
import ActionableTasks from "./ActionableTasks";
import { formatFileSize, getFileIcon, getFileExtension } from "@/lib/file-utils";

// Placeholder type
import { KnowledgeItem } from "@/lib/types";

export default function KnowledgeDetail({ id }: { id: string }) {
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isFile = item?.source === 'File Upload';
  const isLink = item?.originalContent && (item.originalContent.startsWith('http') || item.originalContent.startsWith('www'));

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/knowledge/${id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
        } else {
          setItem(null);
        }
      } catch (error) {
        console.error("Failed to fetch knowledge item:", error);
        setItem(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleDownload = async () => {
    if (!item) return;
    try {
      const response = await fetch(`/api/knowledge/${item.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName || 'download.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Download failed:", response.statusText);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      // You could add a toast notification here
    }
  };

  const handleViewOriginal = () => {
    if (!item) return;
    if (isLink) {
      window.open(item.originalContent, '_blank');
    } else {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${item.title} - Original Content</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .header { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                .content { white-space: pre-wrap; word-wrap: break-word; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${item.title}</h1>
                <p><strong>Source:</strong> ${item.source}</p>
                ${item.fileName ? `<p><strong>File:</strong> ${item.fileName}</p>` : ''}
              </div>
              <div class="content">${item.originalContent}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  if (isLoading) {
    return <KnowledgeDetailSkeleton />;
  }

  if (!item) {
    return <div>Item not found.</div>;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Column: AI Analysis */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">{item.title}</h1>
            
            {/* File/Source Information */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                {isFile ? <FileText className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                {item.source}
              </Badge>
              
              {isFile && item.fileName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <span>{getFileIcon(item.fileType || '')}</span>
                  {getFileExtension(item.fileName, item.fileType).toUpperCase()}
                </Badge>
              )}
              
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOriginal}
              className="flex items-center justify-center gap-2 knowledge-view-btn"
            >
              <Eye className="h-4 w-4" />
              {isLink ? 'Open Link' : 'View Original'}
            </Button>
            
            {isFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 knowledge-download-btn"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        {/* File Details */}
        {isFile && (
          <div className="bg-muted/50 rounded-xl p-6 mb-6 border border-muted-foreground/10">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>{getFileIcon(item.fileType || '')}</span>
              File Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">File Name:</span>
                <p className="font-medium break-all bg-background/50 rounded-md p-2 border">
                  {item.fileName}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">File Size:</span>
                <p className="font-medium bg-background/50 rounded-md p-2 border">
                  {formatFileSize(item.fileSize || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">File Type:</span>
                <p className="font-medium bg-background/50 rounded-md p-2 border">
                  {item.fileType}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Upload Date:</span>
                <p className="font-medium bg-background/50 rounded-md p-2 border">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="key-points">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="key-points">Key Points</TabsTrigger>
            <TabsTrigger value="full-summary">Full Summary</TabsTrigger>
            <TabsTrigger value="original">Original</TabsTrigger>
          </TabsList>
          <TabsContent value="key-points" className="mt-4">
            <p className="leading-relaxed">{item.tldr}</p>
          </TabsContent>
          <TabsContent value="full-summary" className="mt-4">
            <p className="whitespace-pre-wrap leading-relaxed">{item.summary}</p>
          </TabsContent>
          <TabsContent value="original" className="mt-4">
            <div className="bg-muted/30 rounded-xl p-4 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <h3 className="font-semibold">Original Content</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewOriginal}
                    className="flex items-center gap-1 knowledge-view-btn"
                  >
                    <Eye className="h-3 w-3" />
                    Full View
                  </Button>
                  {isFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="flex items-center gap-1 knowledge-download-btn"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {item.originalContent.substring(0, 1000)}
                {item.originalContent.length > 1000 && '...'}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column: Action Center */}
      <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold mb-2">Tags</h2>
            <TagsEditor initialTags={item.tags} knowledgeId={item.id} />
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-2">Actionable Tasks</h2>
            <ActionableTasks initialTasks={item.tasks} knowledgeId={item.id} />
        </div>
      </div>
    </div>
  );
}

function KnowledgeDetailSkeleton() {
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex gap-4 mb-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </div>
    )
}