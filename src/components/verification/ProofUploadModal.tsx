import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { Upload, FileImage, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProofUploadModalProps {
  onUpload: (file: File) => Promise<string | null>;
  onComplete: (proofUrl: string) => void;
  onClose: () => void;
}

export const ProofUploadModal = ({ onUpload, onComplete, onClose }: ProofUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only images (JPG, PNG, GIF) and PDFs are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const url = await onUpload(file);
      if (url) {
        toast.success('Proof uploaded successfully!');
        onComplete(url);
      }
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <PixelPanel className="relative">
          <button onClick={onClose} className="absolute top-4 right-4">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <h2 className="font-pixel text-sm text-foreground mb-6">
            Upload Proof
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-game text-xl text-muted-foreground mb-2">
                Click to upload
              </p>
              <p className="font-game text-lg text-muted-foreground/60">
                Images or PDF (max 5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg pixel-border"
                  />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-card p-1 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <FileText className="w-10 h-10 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-game text-lg text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="font-game text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button onClick={() => setFile(null)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <PixelButton
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Quest
                    </>
                  )}
                </PixelButton>
                <PixelButton variant="secondary" onClick={onClose}>
                  Cancel
                </PixelButton>
              </div>
            </div>
          )}
        </PixelPanel>
      </motion.div>
    </motion.div>
  );
};
