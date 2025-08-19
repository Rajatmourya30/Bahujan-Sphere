/**
 * Image optimization utilities for Firebase Storage uploads
 */

/**
 * Compress an image file to reduce storage costs and improve load times
 */
export function compressImage(
  file: File, 
  maxWidth: number = 800, 
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress the image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'));
          return;
        }
        
        // Create new file with compressed data
        const compressedFile = new File([blob], file.name, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image to specific dimensions (may not maintain aspect ratio)
 */
export function resizeImage(
  file: File,
  width: number,
  height: number,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to resize image'));
          return;
        }
        
        const resizedFile = new File([blob], file.name, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        resolve(resizedFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a thumbnail from an image file
 */
export function createThumbnail(
  file: File,
  size: number = 150,
  quality: number = 0.7
): Promise<File> {
  return compressImage(file, size, size, quality);
}

/**
 * Convert image to WebP format for better compression (if supported)
 */
export function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Check if WebP is supported
    const canvas = document.createElement('canvas');
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (!webpSupported) {
      // Fallback to JPEG compression
      compressImage(file, 800, 800, quality).then(resolve).catch(reject);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert to WebP'));
          return;
        }
        
        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { 
          type: 'image/webp',
          lastModified: Date.now()
        });
        
        resolve(webpFile);
      }, 'image/webp', quality);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file and get metadata
 */
export async function validateAndAnalyzeImage(
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): Promise<{
  isValid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
  sizeMB?: number;
}> {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      isValid: false,
      error: `File size ${sizeMB.toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }
  
  try {
    const dimensions = await getImageDimensions(file);
    return {
      isValid: true,
      dimensions,
      sizeMB
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to analyze image file'
    };
  }
}

/**
 * Create a data URL from an image file for preview purposes
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
