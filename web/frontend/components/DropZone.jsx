import { DropZone as PolarisDropZone, LegacyStack, Thumbnail, Text, Button } from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks';

export function DropZone({ setFormData, formData }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fetch = useAuthenticatedFetch();

  // Initialize files state if formData already has files
  useEffect(() => {
    if (formData?.files?.length) {
      const initialFiles = formData.files.map((file) => ({
        name: file.FileName,
        url: file.FileUrl,
        id: file.FileId, // Store file ID for removal
      }));
      setFiles(initialFiles);
    }
  }, [formData]);

  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]); // Add new files to existing files
    setUploading(false);
  }, []);

  useEffect(() => {
    if (files.length > 0 && !uploading) {
      handleUpload();
    }
  }, [files]);

  const handleUpload = async () => {
    if (!uploading) {
      setUploading(true);
      const uploadFormData = new FormData();

      files.forEach((file) => {
        if (!file.url) {
          // Only upload files that haven't been uploaded yet
          uploadFormData.append('file', file);
        }
      });

      if (uploadFormData.has('file')) {
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log('File uploaded successfully');

            // Update formData with the uploaded file details
            const uploadedFilesData = [
              {
                FileName: responseData.file?.filename,
                FileId: responseData.file?._id,
                FileUrl: responseData.file?.path,
              },
            ];

            setFormData((prevData) => ({
              ...prevData,
              files: [...(prevData.files || []), ...uploadedFilesData], // Append uploaded files data
            }));

            // Update the files state to include the uploaded files with their URLs
            const updatedFiles = files.map((file) => {
              const uploadedFile = responseData.files.find((f) => f.filename === file.name);
              return uploadedFile ? { ...file, url: uploadedFile.path } : file;
            });
            setFiles(updatedFiles);
          } else {
            console.error('File upload failed');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      // Remove the file from the server/database
      const response = await fetch(`/api/remove-file/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('File removed successfully');

        // Update the files state
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));

        // Update formData
        setFormData((prevData) => ({
          ...prevData,
          files: prevData.files.filter((file) => file.FileId !== fileId),
        }));
      } else {
        // Handle server response errors
        const errorData = await response.json();
        console.error('Failed to remove the file:', errorData.message);
      }
    } catch (error) {
      // Handle network or unexpected errors
      console.error('Error removing file:', error);
    }
  };

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

  // Handle displaying existing files and new uploads
  const uploadedFiles = files.length > 0 && (
    <div style={{ padding: '0' }}>
      <LegacyStack vertical>
        {files.map((file, index) => (
          <LegacyStack alignment="center" key={index}>
            <Thumbnail
              size="small"
              alt={file.name}
              source={
                file.url // Use the relative path directly without any domain prepending
                  ? file.url
                  : validImageTypes.includes(file.type)
                    ? window.URL.createObjectURL(file)
                    : null
              }
            />
            <div>
              {file.name} <Text variant="bodySm">{file.size ? `${file.size} bytes` : ''}</Text>
            </div>
            <Button
              plain
              destructive
              onClick={(e) => {
                e.stopPropagation(); // Prevent the DropZone from opening the file upload popup
                handleRemoveFile(file.id);
              }}
            >
              Remove
            </Button>
          </LegacyStack>
        ))}
      </LegacyStack>
    </div>
  );

  return (
    <PolarisDropZone onDrop={handleDropZoneDrop}>
      {uploadedFiles}
      {!files.length && <PolarisDropZone.FileUpload />}
    </PolarisDropZone>
  );
}
