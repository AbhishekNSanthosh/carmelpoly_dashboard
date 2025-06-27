"use client"
import React, { useEffect, useState } from "react";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { app } from "@lib/firebase";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import easyToast from "@components/CustomToast";

interface EditProps {
  code: string;
  onSave?: (text: string, imageUrl: string) => void;
}

const Edit: React.FC<EditProps> = ({ code, onSave }) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState(""); // For image preview
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const db = getFirestore(app);
  const storage = getStorage(app);

  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!code) return;
      setLoading(true);
      try {
        const docRef = doc(db, "departments", code);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDeptName(data.name || "");
          setText(data.description || "");
          const url = data.imageUrl || "";
          setImageUrl(url);
          setPreviewUrl(url);
        } else {
          console.warn("No department found with code:", code);
          easyToast({
            type: "error",
            message: "Department not found.",
          });
        }
      } catch (err) {
        console.error("Error fetching department:", err);
        easyToast({
          type: "error",
          message: "Failed to fetch department data.",
        });
      }
      setLoading(false);
    };

    fetchDepartmentData();
  }, [code, db]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    setDeleting(true);
    try {
      const imageRef = storageRef(storage, imageUrl);
      await deleteObject(imageRef);
      setImageUrl("");
      setPreviewUrl("");
      setImage(null);

      await setDoc(
        doc(db, "departments", code),
        { imageUrl: "" },
        { merge: true }
      );
      easyToast({ type: "success", message: "Image deleted." });
      onSave?.(text, "");
    } catch (err) {
      console.error("Error deleting image:", err);
      easyToast({ type: "error", message: "Failed to delete image." });
    }
    setDeleting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;

      if (image) {
        const newImageRef = storageRef(
          storage,
          `department/${code}/${Date.now()}_${image.name}`
        );
        await uploadBytes(newImageRef, image);
        finalImageUrl = await getDownloadURL(newImageRef);

        if (imageUrl && imageUrl !== finalImageUrl) {
          try {
            const oldImageRef = storageRef(storage, imageUrl);
            await deleteObject(oldImageRef);
          } catch (e) {
            console.warn("Failed to delete old image, but continuing:", e);
          }
        }
      }

      await setDoc(
        doc(db, "departments", code),
        {
          description: text,
          imageUrl: finalImageUrl,
        },
        { merge: true }
      );

      onSave?.(text, finalImageUrl);
      setImageUrl(finalImageUrl);
      setPreviewUrl(finalImageUrl);
      setImage(null);
      easyToast({ type: "success", message: "Department saved!" });
    } catch (err) {
      console.error("Error saving department:", err);
      easyToast({ type: "error", message: "Failed to save department." });
    }
    setIsSaving(false);
  };

  if (loading) {
    return <div className="text-center py-10">Loading department data...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
      {/* Page Heading */}
      <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-6">
        Edit Department of{" "}
        <span className="text-blue-600">{deptName}</span>
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side (Text Area) */}
        <div className="flex-1 flex flex-col">
          <p className="text-sm text-gray-500 mb-4">Code: {code}</p>

          <label
            htmlFor="edit-text"
            className="mb-2 font-semibold text-gray-800"
          >
            Description
          </label>
          <textarea
            id="edit-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full min-h-[200px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-y"
            placeholder="Enter your department description..."
          />
        </div>

        {/* Right Side (Image Upload) */}
        <div className="flex-1 flex flex-col items-center">
          <label className="mb-2 font-semibold text-gray-800">
            Department Image
          </label>

          <div className="relative w-full max-w-xs mb-4 min-h-[200px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Department"
                  className="w-full h-[200px] object-cover"
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  disabled={deleting}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full shadow-md text-xs font-semibold z-10 transition-opacity"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500 p-4">
                <p>No image uploaded.</p>
                <p className="text-xs">Select an image below.</p>
              </div>
            )}
          </div>

          <div className="w-full max-w-xs">
            <label
              htmlFor="image-upload"
              className="w-full text-center bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {image ? `Selected: ${image.name}` : "Choose New Image"}
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg shadow-lg font-semibold text-lg transition duration-200 flex items-center"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default Edit;