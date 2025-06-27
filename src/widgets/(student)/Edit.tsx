"use client"
import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface EditProps {
  initialText?: string;
  initialImageUrl?: string;
  onSave?: (text: string, imageUrl: string) => void;
}

const Edit: React.FC<EditProps> = ({ initialText = "", initialImageUrl = "", onSave }) => {
  const [text, setText] = useState(initialText);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `uploads/${Date.now()}_${image.name}`);
    await uploadBytes(storageRef, image);
    const url = await getDownloadURL(storageRef);
    setImageUrl(url);
    setUploading(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(text, imageUrl);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "2rem",
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <label htmlFor="edit-text" style={{ marginBottom: 8, fontWeight: 500 }}>
          Description
        </label>
        <textarea
          id="edit-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          style={{
            width: "100%",
            resize: "vertical",
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
            minHeight: 200,
          }}
          placeholder="Enter your text here..."
        />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <label style={{ marginBottom: 8, fontWeight: 500 }}>Image Upload</label>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{ width: "100%", maxWidth: 300, marginBottom: 16, borderRadius: 8 }}
          />
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button
          onClick={handleUpload}
          disabled={!image || uploading}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#1976d2",
            color: "#fff",
            cursor: uploading ? "not-allowed" : "pointer",
            fontWeight: 500,
          }}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
      <style>
        {`
          @media (max-width: 700px) {
            div[style*="flex-direction: row"] {
              flex-direction: column !important;
              gap: 1.5rem !important;
            }
          }
        `}
      </style>
      <button
        onClick={handleSave}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "12px 28px",
          borderRadius: 8,
          background: "#388e3c",
          color: "#fff",
          border: "none",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  );
};

export default Edit;