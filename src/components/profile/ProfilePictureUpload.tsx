'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { type User } from 'firebase/auth';

interface ProfilePictureUploadProps {
  user: User;
  currentPhotoUrl?: string;
  userName: string;
  onPhotoUpdate: (newPhotoUrl: string) => void;
}

export function ProfilePictureUpload({ 
  user, 
  currentPhotoUrl, 
  userName, 
  onPhotoUpdate 
}: ProfilePictureUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPG, PNG, GIF, etc.)';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB';
    }

    // Check for common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return 'Please use JPG, PNG, GIF, or WebP format';
    }

    return null;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast({ 
        title: 'Invalid File', 
        description: validationError, 
        variant: 'destructive' 
      });
      return;
    }

    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !user) {
      toast({ 
        title: 'Error', 
        description: 'No file selected or user not authenticated', 
        variant: 'destructive' 
      });
      return;
    }

    setIsUploading(true);
    
    try {
      console.log('Starting upload process...');
      console.log('User ID:', user.uid);
      console.log('File:', photoFile.name, photoFile.type, photoFile.size);

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = photoFile.name.split('.').pop() || 'jpg';
      const fileName = `profile_${timestamp}.${fileExtension}`;
      
      // Create storage reference - matching the security rule path exactly
      const storagePath = `profilePictures/${user.uid}/${fileName}`;
      console.log('Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);

      // Upload file with metadata
      const metadata = {
        contentType: photoFile.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: photoFile.name
        }
      };

      console.log('Uploading to Firebase Storage...');
      const uploadResult = await uploadBytes(storageRef, photoFile, metadata);
      console.log('Upload successful:', uploadResult);

      // Get download URL
      console.log('Getting download URL...');
      const newPhotoUrl = await getDownloadURL(storageRef);
      console.log('Download URL obtained:', newPhotoUrl);

      // Update user document in Firestore (create if it doesn't exist)
      console.log('Updating Firestore document...');
      const userDocRef = doc(db, 'users', user.uid);
      
      try {
        await updateDoc(userDocRef, { 
          photoUrl: newPhotoUrl,
          photoUpdatedAt: new Date().toISOString()
        });
        console.log('Firestore document updated successfully');
      } catch (updateError: any) {
        if (updateError.code === 'not-found') {
          // Document doesn't exist, create it
          console.log('User document not found, creating new document...');
          const { setDoc } = await import('firebase/firestore');
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userName,
            photoUrl: newPhotoUrl,
            createdAt: new Date().toISOString(),
            photoUpdatedAt: new Date().toISOString()
          });
          console.log('New user document created successfully');
        } else {
          throw updateError; // Re-throw if it's a different error
        }
      }

      // Delete old photo if it exists and is different
      if (currentPhotoUrl && currentPhotoUrl !== newPhotoUrl && currentPhotoUrl.includes('firebase')) {
        try {
          const oldPhotoRef = ref(storage, currentPhotoUrl);
          await deleteObject(oldPhotoRef);
          console.log('Old photo deleted successfully');
        } catch (deleteError) {
          console.log('Could not delete old photo (this is normal):', deleteError);
        }
      }

      // Update parent component
      onPhotoUpdate(newPhotoUrl);
      
      // Reset form
      setPhotoFile(null);
      setPhotoPreview(newPhotoUrl);

      toast({ 
        title: 'Success', 
        description: 'Your profile picture has been updated successfully!' 
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to update profile picture. ';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage += 'You do not have permission to upload files. Please check your account status.';
      } else if (error.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage += 'An unknown error occurred. Please try again.';
      } else if (error.code === 'storage/invalid-format') {
        errorMessage += 'Invalid file format. Please use JPG, PNG, or GIF.';
      } else if (error.code === 'storage/invalid-argument') {
        errorMessage += 'Invalid file or upload parameters.';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error'}`;
      }

      toast({ 
        title: 'Upload Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      
      // Reset preview to current photo on error
      setPhotoPreview(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPhotoFile(null);
    setPhotoPreview(currentPhotoUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar
          className="h-24 w-24 cursor-pointer transition-all hover:opacity-80"
          onClick={() => fileInputRef.current?.click()}
        >
          <AvatarImage src={photoPreview || undefined} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
            {userName ? userName.charAt(0).toUpperCase() : user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Camera className="h-8 w-8 text-white" />
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        className="hidden"
        disabled={isUploading}
      />

      {photoFile && (
        <div className="flex gap-2">
          <Button 
            onClick={handlePhotoUpload} 
            disabled={isUploading} 
            size="sm"
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Save Picture
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleCancel} 
            disabled={isUploading} 
            variant="outline" 
            size="sm"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}

      {!photoFile && (
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          variant="outline" 
          size="sm"
          disabled={isUploading}
        >
          <Camera className="mr-2 h-4 w-4" />
          Change Picture
        </Button>
      )}
    </div>
  );
}
