import React, { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button, Dialog, DialogContent, DialogTitle, Slider, Stack, } from '@mui/material';
import Box from '@mui/material/Box';
import { getCroppedImageBlob } from '@/components/users/utils/getCroppedImageBlob.ts';
import { userApi } from '@/api/parts/user.ts';

export default function ImageCropper({ onAvatarUpdated }: { onAvatarUpdated?: () => void }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rotation, setRotation] = useState(0);

  const onCropComplete = useCallback((_: unknown, croppedPixels: Area): void => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file: File | undefined = e.target.files?.[0];
    if (file) {
      const imageDataUrl: string = await readFile(file);
      setImageSrc(imageDataUrl);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
      setModalOpen(true);
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve): void => {
      const reader: FileReader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.readAsDataURL(file);
    });
  };
  const handleUpload = async (): Promise<void> => {
    if (!imageSrc || !croppedAreaPixels) return;

    const blob: Blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, rotation);
    const file: File = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

    await userApi.uploadAvatar(file);
    if (onAvatarUpdated) {
      onAvatarUpdated();
    }
    setModalOpen(false);
  };

  return (
    <div>
      <input
        accept="image/*"
        type="file"
        id="upload"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <label htmlFor="upload">
        <Button variant="contained" component="span">
                    Upload Image
        </Button>
      </label>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crop your image</DialogTitle>
        <DialogContent style={{ height: 400, position: 'relative' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          )}
        </DialogContent>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Zoom</label>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_: Event, z: number) => setZoom(z as number)}
            />
          </div>

          <Box sx={{ marginBottom: '1rem' }}>
            <label>Rotation</label>
            <Slider
              value={rotation}
              min={0}
              max={360}
              step={1}
              onChange={(_: Event, r: number) => setRotation(r as number)}
            />
          </Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button onClick={() => setModalOpen(false)} sx={{
              px: 10,
              py: 0,
            }}>Cancel</Button>
            <Button onClick={() => handleUpload()} sx={{
              px: 10,
              py: 0,
            }}>Done</Button>
          </Stack>
        </div>
      </Dialog>
    </div>
  );
};