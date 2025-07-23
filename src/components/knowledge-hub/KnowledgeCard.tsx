import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KnowledgeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, FileText, Download, Eye } from "lucide-react";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { formatFileSize, getFileIcon, getFileExtension } from "@/lib/file-utils";

interface KnowledgeCardProps {
  item: KnowledgeItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function KnowledgeCard({ item, isSelected, onSelect }: KnowledgeCardProps) {
  const isLink = item.originalContent && (item.originalContent.startsWith('http') || item.originalContent.startsWith('www'));
  const isFile = item.source === 'File Upload';
  const { fetchItems, toggleFilterTag, filterTags } = useKnowledgeHubStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/knowledge/${item.id}`, { method: 'DELETE' });
      fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleViewOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLink) {
      window.open(item.originalContent, '_blank');
    } else {
      // For files, show original content in a modal or new tab
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${item.title} - Original Content</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
              <h1>${item.title}</h1>
              <hr>
              <pre style="white-space: pre-wrap; word-wrap: break-word;">${item.originalContent}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  return (
    <Card
      className={cn(
        "cyberpunk-border cursor-pointer group transition-all duration-300 rounded-xl flex flex-col",
        "shadow-lg shadow-primary/20",
        isSelected && "shadow-xl shadow-primary/40 ring-2 ring-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="cyberpunk-fuse"></div>
      <div className="cyberpunk-card-content flex flex-col flex-1">
        {/* Top - Image Section */}
        <div className="w-full h-32 relative rounded-t-xl overflow-hidden flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={item.thumbnail || 'https://source.unsplash.com/400x200/?abstract,pattern'}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30"></div>
                </div>
              </TooltipTrigger>
              {item.attribution && (
                <TooltipContent>
                  <p dangerouslySetInnerHTML={{ __html: item.attribution }} />
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Bottom - Content Section */}
        <div className="flex-1 flex flex-col p-4">
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-3 right-3 z-20 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:shadow-md"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="flex items-start justify-between mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-base font-bold line-clamp-2 flex-1 cursor-help leading-relaxed pr-2">
                    {item.title}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{item.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isFile && (
              <div className="flex-shrink-0">
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <span>{getFileIcon(item.fileType || '')}</span>
                  File
                </Badge>
              </div>
            )}
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed mb-4 flex-grow">
                  {item.tldr}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md">
                <p className="text-sm whitespace-pre-wrap">{item.tldr}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Tags Section */}
          <div className="flex gap-2 flex-wrap mb-4">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant={filterTags.includes(tag) ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-0.5"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFilterTag(tag);
                }}
              >
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* File Info for Files */}
          {isFile && (
            <div className="text-muted-foreground bg-muted/30 rounded-lg p-3 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-xs">
                    📁
                    {item.fileName && item.fileName.length > 40
                      ? `${item.fileName.slice(0, 25)}...${item.fileName.slice(-15)}`
                      : item.fileName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Size: {formatFileSize(item.fileSize || 0)}</span>
                  <span>Type: {getFileExtension(item.fileName || '', item.fileType).toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <CardFooter className="p-4 pt-0 flex flex-col gap-4 mt-auto">
          {/* Action Buttons Row */}
          <div className="flex items-center justify-between w-full">
            {/* File Type Badge */}
            {isFile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="knowledge-file-badge text-xs flex items-center gap-1 px-2 py-0.5">
                      <span>{getFileIcon(item.fileType || '')}</span>
                      {getFileExtension(item.fileName || '', item.fileType).toUpperCase()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.fileName} ({formatFileSize(item.fileSize || 0)})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <div className="flex items-center gap-3 ml-auto">
              {/* View Original Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 knowledge-view-btn hover:shadow-md transition-all duration-200"
                      onClick={handleViewOriginal}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLink ? 'Open Link' : 'View Original Content'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Download Button (Files Only) */}
              {isFile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 knowledge-download-btn hover:shadow-md transition-all duration-200"
                        onClick={handleDownload}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download File</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* External Link Button (Links Only) */}
              {isLink && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.originalContent} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 knowledge-external-btn hover:shadow-md transition-all duration-200"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open in New Tab</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Source and Date Info */}
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground border-t pt-3">
            <span className="flex items-center gap-2">
              📅 {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <span className="font-medium">{item.source}</span>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}