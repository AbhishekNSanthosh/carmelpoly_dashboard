"use client";
import React, { useState, useEffect } from "react";
import easyToast from "../../common/components/CustomToast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Faculty } from "../../common/interface/interface";

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (faculty: Omit<Faculty, "id">) => void;
  departmentCode: string;
}

const FacultyModal: React.FC<FacultyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departmentCode,
}) => {
  const [name, setName] = useState("");
  const [qualification, setQualification] = useState("");
  const [designation, setDesignation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qualification || !designation || !image) {
      easyToast({ type: "error", message: "Please fill all fields and select an image." });
      return;
    }

    setIsUploading(true);
    try {
      const storage = getStorage();
      const imageRef = ref(
        storage,
        `department/${departmentCode}/faculty/${Date.now()}_${image.name}`
      );
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      onSubmit({
        name,
        qualification,
        designation,
        imageUrl,
      });

      // Reset form and close modal
      setName("");
      setQualification("");
      setDesignation("");
      setImage(null);
      onClose();
    } catch (error) {
      console.error("Error uploading image or submitting faculty:", error);
      easyToast({ type: "error", message: "Failed to add faculty member." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Add Faculty Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input type="text" id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input type="text" id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {preview && <img src={preview} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-md"/>}
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isUploading} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">
              {isUploading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyModal; 