import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KnowledgeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, FileText, Download, Eye, Calendar as CalendarIcon } from "lucide-react";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { formatFileSize, getFileIcon, getFileExtension } from "@/lib/file-utils";
import { useState } from "react";

interface KnowledgeCardProps {
  item: KnowledgeItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function KnowledgeCard({ item, isSelected, onSelect }: KnowledgeCardProps) {
  const [isPressed, setIsPressed] = useState(false);
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

  // معالجات الضغط للتأثير البصري
  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    setIsPressed(true);
    onSelect();
    // إزالة التأثير بعد وقت قصير
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div className="relative group">
      {/* إطار الإضاءة الأزرق الثابت */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur-sm opacity-75 group-hover:opacity-95 transition duration-300"></div>
      
      {/* البطاقة الرئيسية */}
      <Card
        className={cn(
          "relative cursor-pointer transition-all duration-300 rounded-xl",
          "shadow-lg h-[520px] flex flex-col overflow-hidden bg-background",
          "border border-transparent", // Use transparent border to maintain layout
          isPressed && "animate-press-down", // تأثير الضغط
          isSelected && "ring-2 ring-offset-2 ring-offset-background ring-white" // Clearer selection ring
        )}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
      {/* Delete Button - Always visible for better UX */}
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 z-30 h-7 w-7 rounded-full opacity-80 hover:opacity-100 transition-all duration-200 shadow-md"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      <div className="flex flex-col h-full">
        {/* Image Header with Content Type Indicator */}
        <div className="relative h-36 rounded-t-xl overflow-hidden flex-shrink-0">
          <Image
            src={item.thumbnail || 'https://source.unsplash.com/400x200/?abstract,pattern'}
            alt={item.title}
            fill
            className="object-cover transition-all duration-300"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
          
          {/* Content Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant={isFile ? "default" : isLink ? "secondary" : "outline"} 
              className="text-xs font-medium shadow-sm"
            >
              {isFile && (
                <>
                  {getFileIcon(item.fileType || '')} {getFileExtension(item.fileName || '', item.fileType).toUpperCase()}
                </>
              )}
              {isLink && (
                <>
                  🔗 Link
                </>
              )}
              {!isFile && !isLink && (
                <>
                  📝 Note
                </>
              )}
            </Badge>
          </div>

          {/* File Size Badge (Files Only) */}
          {isFile && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="text-xs bg-black/20 backdrop-blur-sm border-white/30 text-white">
                {formatFileSize(item.fileSize || 0)}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 min-h-0">
          {/* Title Section */}
          <div className="mb-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-lg font-bold line-clamp-2 leading-tight cursor-help">
                    {item.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Summary Section */}
          <div className="mb-4 flex-1 min-h-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed cursor-help">
                    {item.tldr}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-md">
                  <p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{item.tldr}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* File Details Section (Files Only) */}
          {isFile && item.fileName && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">{getFileIcon(item.fileType || '')}</span>
                <span className="font-medium truncate flex-1">
                  {item.fileName.length > 30 
                    ? `${item.fileName.slice(0, 20)}...${item.fileName.slice(-10)}`
                    : item.fileName
                  }
                </span>
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div className="mb-4">
            <div className="flex gap-1 flex-wrap">
              {item.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant={filterTags.includes(tag) ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/80 text-xs transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFilterTag(tag);
                  }}
                >
                  {tag.length > 10 ? `${tag.substring(0, 10)}...` : tag}
                </Badge>
              ))}
              {item.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 4}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/50 bg-muted/30 p-3 flex items-center justify-between">
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* View/Open Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 hover:bg-primary/10"
                    onClick={handleViewOriginal}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLink ? 'Open Link' : 'View Content'}</p>
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
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
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
                        className="h-8 w-8 hover:bg-primary/10"
                      >
                        <ExternalLink className="h-4 w-4" />
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

          {/* Date and Source */}
          <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
              {item.date && (
                <span className="flex items-center gap-1 font-semibold text-primary flex-shrink-0 whitespace-nowrap">
                  <CalendarIcon className="h-3 w-3" /> {new Date(item.date).toLocaleDateString()}
                </span>
              )}
              <span className="truncate max-w-20 font-medium flex-shrink-0">
                {item.source}
              </span>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}