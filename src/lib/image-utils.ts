// Image utilities for Knowledge Hub
import { FileIcon, ImageIcon, FileTextIcon } from 'lucide-react';

export interface ImageAnalysis {
  hasText: boolean;
  quality: 'low' | 'medium' | 'high';
  size: { width: number; height: number };
  fileSize: number;
  format: string;
  textReadability: 'poor' | 'fair' | 'good' | 'excellent';
}

// Analyze image for OCR suitability
export function analyzeImageForOCR(file: File): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Basic analysis
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      // Calculate contrast and brightness
      let totalBrightness = 0;
      let contrastVariance = 0;
      const pixels = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      
      const avgBrightness = totalBrightness / pixels;
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        contrastVariance += Math.pow(brightness - avgBrightness, 2);
      }
      
      const contrast = Math.sqrt(contrastVariance / pixels);
      
      // Determine quality based on size and contrast
      const quality = img.width * img.height > 1000000 ? 'high' : 
                     img.width * img.height > 300000 ? 'medium' : 'low';
      
      const textReadability = contrast > 50 && avgBrightness > 100 && avgBrightness < 200 ? 'excellent' :
                             contrast > 30 ? 'good' :
                             contrast > 15 ? 'fair' : 'poor';
      
      resolve({
        hasText: true, // Assume text is present for now
        quality,
        size: { width: img.width, height: img.height },
        fileSize: file.size,
        format: file.type,
        textReadability
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Get OCR readiness score (0-100)
export function getOCRReadinessScore(analysis: ImageAnalysis): number {
  let score = 50; // Base score
  
  // Size factor
  if (analysis.quality === 'high') score += 20;
  else if (analysis.quality === 'medium') score += 10;
  else score -= 10;
  
  // Text readability factor
  if (analysis.textReadability === 'excellent') score += 30;
  else if (analysis.textReadability === 'good') score += 20;
  else if (analysis.textReadability === 'fair') score += 10;
  else score -= 20;
  
  // File size factor
  if (analysis.fileSize > 5 * 1024 * 1024) score -= 20; // Too large
  else if (analysis.fileSize < 50 * 1024) score -= 10; // Too small
  
  return Math.max(0, Math.min(100, score));
}

// Get recommendations for better OCR
export function getOCRRecommendations(analysis: ImageAnalysis): string[] {
  const recommendations: string[] = [];
  
  if (analysis.quality === 'low') {
    recommendations.push('📏 Increase image resolution for better results');
  }
  
  if (analysis.textReadability === 'poor' || analysis.textReadability === 'fair') {
    recommendations.push('🔆 Improve image contrast and lighting');
    recommendations.push('📝 Ensure text is clearly visible and not blurry');
  }
  
  if (analysis.fileSize > 5 * 1024 * 1024) {
    recommendations.push('📦 Compress image to under 5MB for faster processing');
  }
  
  if (analysis.fileSize < 50 * 1024) {
    recommendations.push('🔍 Use a higher quality image with more detail');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Image looks good for OCR processing!');
  }
  
  return recommendations;
}
