"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Download, ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerDialogProps {
  imageUrl: string;
  issueId: number;
  description?: string;
  children?: React.ReactNode;
}

export function ImageViewerDialog({ 
  imageUrl, 
  issueId, 
  description, 
  children 
}: ImageViewerDialogProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `issue-${issueId}-image.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Issue #{issueId} - Image</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="flex items-center gap-1"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="h-4 w-4" />
                    Zoom Out
                  </>
                ) : (
                  <>
                    <ZoomIn className="h-4 w-4" />
                    Zoom In
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative overflow-auto max-h-[70vh]">
          <div className={`transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'} origin-center`}>
            <Image
              src={imageUrl}
              alt={`Issue ${issueId} photo`}
              width={800}
              height={600}
              className="w-full h-auto object-contain rounded-lg"
              priority
            />
          </div>
        </div>
        
        {description && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Issue Description:</p>
            <p className="text-sm">{description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
