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
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import easyToast from "@components/CustomToast";
import { FaTrash, FaUserTie, FaChalkboardTeacher, FaInfoCircle, FaBullseye, FaLightbulb } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Redefining Faculty interface locally to resolve import issue
export interface Faculty {
  id: string;
  name: string;
  qualification: string;
  designation: string;
  imageUrl: string;
}

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
  const [deptCode, setDeptCode] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [vision, setVision] = useState<string[]>([""]);
  const [mission, setMission] = useState<string[]>([""]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyQualification, setNewFacultyQualification] = useState("");
  const [newFacultyDesignation, setNewFacultyDesignation] = useState("");
  const [newFacultyImage, setNewFacultyImage] = useState<File | null>(null);
  const [newFacultyImagePreview, setNewFacultyImagePreview] = useState<
    string | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();
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
          setDeptCode(data.code || "");
          setText(data.description || "");
          const url = data.imageUrl || "";
          setImageUrl(url);
          setPreviewUrl(url);
          setVision(data.vision && data.vision.length > 0 ? data.vision : [""]);
          setMission(
            data.mission && data.mission.length > 0 ? data.mission : [""]
          );
          setFaculty(data.faculty || []);
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

  const handlePointChange = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => {
      const newPoints = [...prev];
      newPoints[index] = value;
      return newPoints;
    });
  };

  const addPoint = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const removePoint = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newFacultyName ||
      !newFacultyQualification ||
      !newFacultyDesignation ||
      !newFacultyImage
    ) {
      easyToast({
        type: "error",
        message: "Please fill all fields and select an image.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const storage = getStorage();
      const imageRef = storageRef(
        storage,
        `department/${code}/faculty/${Date.now()}_${newFacultyImage.name}`
      );
      await uploadBytes(imageRef, newFacultyImage);
      const imageUrl = await getDownloadURL(imageRef);

      const newFaculty: Faculty = {
        id: `faculty-${Date.now()}`,
        name: newFacultyName,
        qualification: newFacultyQualification,
        designation: newFacultyDesignation,
        imageUrl,
      };

      setFaculty((prev) => [...prev, newFaculty]);

      // Reset form and close modal
      setNewFacultyName("");
      setNewFacultyQualification("");
      setNewFacultyDesignation("");
      setNewFacultyImage(null);
      setNewFacultyImagePreview(null);
      setIsFacultyModalOpen(false);
    } catch (error) {
      console.error("Error uploading image or submitting faculty:", error);
      easyToast({ type: "error", message: "Failed to add faculty member." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFaculty = (id: string) => {
    // Also consider deleting the image from storage
    setFaculty((prev) => prev.filter((f) => f.id !== id));
  };

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
      if (!deptName || !deptCode) {
        easyToast({
          type: "error",
          message: "Department name and code cannot be empty.",
        });
        setIsSaving(false);
        return;
      }

      // Check if new code is already in use, if it has changed
      if (deptCode !== code) {
        const newDocRef = doc(db, "departments", deptCode);
        const newDocSnap = await getDoc(newDocRef);
        if (newDocSnap.exists()) {
          easyToast({
            type: "error",
            message: `Department code "${deptCode}" is already in use.`,
          });
          setIsSaving(false);
          return;
        }
      }

      let finalImageUrl = imageUrl;

      // Handle image upload
      if (image) {
        const imageCode = deptCode || code; // Use new code if available
        const newImageRef = storageRef(
          storage,
          `department/${imageCode}/${Date.now()}_${image.name}`
        );
        await uploadBytes(newImageRef, image);
        finalImageUrl = await getDownloadURL(newImageRef);

        // Delete old image if it exists and is different
        if (imageUrl && imageUrl !== finalImageUrl) {
          try {
            const oldImageRef = storageRef(storage, imageUrl);
            await deleteObject(oldImageRef);
          } catch (e) {
            console.warn("Failed to delete old image, but continuing:", e);
          }
        }
      }

      const dataToSave = {
        name: deptName,
        code: deptCode.toLowerCase(),
        description: text,
        imageUrl: finalImageUrl,
        vision: vision.filter((v) => v.trim() !== ""),
        mission: mission.filter((m) => m.trim() !== ""),
        faculty: faculty,
        updatedAt: serverTimestamp(),
      };

      if (deptCode === code) {
        // Code hasn't changed, just update the document
        await setDoc(doc(db, "departments", code), dataToSave, {
          merge: true,
        });
      } else {
        // Code has changed, create new doc and delete old one
        const oldDocRef = doc(db, "departments", code);
        const oldDocSnap = await getDoc(oldDocRef);

        if (oldDocSnap.exists()) {
          const oldData = oldDocSnap.data();
          await setDoc(doc(db, "departments", deptCode), {
            ...oldData, // Preserve created_at and other fields
            ...dataToSave,
          });
          await deleteDoc(oldDocRef);
        } else {
          // old doc not found, just create a new one
          await setDoc(doc(db, "departments", deptCode), dataToSave, {
            merge: true,
          });
        }
      }

      onSave?.(text, finalImageUrl);
      setImageUrl(finalImageUrl);
      setPreviewUrl(finalImageUrl);
      setImage(null);
      easyToast({ type: "success", message: "Department saved!" });

      if (deptCode !== code) {
        // Redirect to new page if code changed
        router.push(`/dashboard/department/edit/${deptCode}`);
      }
    } catch (err) {
      console.error("Error saving department:", err);
      easyToast({ type: "error", message: "Failed to save department." });
    }
    setIsSaving(false);
  };

  const handleNewFacultyImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFacultyImage(file);
      const objectUrl = URL.createObjectURL(file);
      setNewFacultyImagePreview(objectUrl);
    }
  };

  // Move faculty up in the list
  const moveFacultyUp = (index: number) => {
    if (index === 0) return;
    setFaculty((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
  };

  // Move faculty down in the list
  const moveFacultyDown = (index: number) => {
    if (index === faculty.length - 1) return;
    setFaculty((prev) => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="flex space-x-2 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-4 h-4 bg-primary rounded-full"
              animate={{
                y: [0, -12, 0],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <span className="text-lg text-gray-600 font-medium animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-8 py-4">
      {/* Page Heading */}
      <div className="flex items-center gap-3 mb-8">
        <FaInfoCircle className="text-primary-600 text-3xl" />
        <h1 className="text-3xl font-bold text-gray-900">Edit Department</h1>
      </div>

      {/* Department Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <label htmlFor="dept-name" className="mb-2 block font-semibold text-gray-800">Department Name</label>
          <input
            id="dept-name"
            type="text"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            placeholder="Enter department name"
          />
        </div>
        <div>
          <label htmlFor="dept-code" className="mb-2 block font-semibold text-gray-800">Department Code</label>
          <input
            id="dept-code"
            type="text"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            placeholder="Enter department code"
          />
          <p className="text-sm text-gray-500 mt-2">Original Code: <span className="font-mono">{code}</span></p>
        </div>
      </div>

      {/* Description Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <FaChalkboardTeacher className="text-primary-600" />
          <label htmlFor="edit-text" className="font-semibold text-gray-800">Department Description</label>
        </div>
        <textarea
          id="edit-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full min-h-[120px] p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base resize-y transition"
          placeholder="Enter your department description..."
        />
      </div>

      {/* Image Upload Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-2">
          <FaUserTie className="text-primary-600" />
          <span className="font-semibold text-gray-800">Department Image</span>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-full max-w-xs min-h-[200px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Department"
                  className="w-full h-[200px] object-cover rounded-lg shadow"
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  disabled={deleting}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full shadow-md text-xs font-semibold z-10 transition-opacity"
                  aria-label="Delete department image"
                  title="Delete image"
                >
                  {deleting ? "Deleting..." : <FaTrash />}
                </button>
              </>
            ) : (
              <div className="text-center text-gray-400">No image uploaded</div>
            )}
          </div>
          <div className="w-full max-w-xs">
            <label
              htmlFor="image-upload"
              className="w-full text-center bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition"
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

      {/* Vision and Mission Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
        {/* Vision Section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <FaLightbulb className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-800">Vision</h2>
          </div>
          <div className="flex flex-col gap-4">
            {vision.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <textarea
                  value={point}
                  onChange={(e) => handlePointChange(setVision, index, e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  placeholder={`Vision point ${index + 1}`}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => removePoint(setVision, index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full flex-shrink-0"
                  aria-label="Remove vision point"
                  title="Remove"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPoint(setVision)}
              className="bg-primary hover:bg-primary-700 text-white p-2 rounded-md self-start mt-2 transition"
            >
              + Add Vision Point
            </button>
          </div>
        </div>

        {/* Mission Section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <FaBullseye className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-800">Mission</h2>
          </div>
          <div className="flex flex-col gap-4">
            {mission.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <textarea
                  value={point}
                  onChange={(e) => handlePointChange(setMission, index, e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  placeholder={`Mission point ${index + 1}`}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => removePoint(setMission, index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full flex-shrink-0"
                  aria-label="Remove mission point"
                  title="Remove"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPoint(setMission)}
              className="bg-primary hover:bg-primary-700 text-white p-2 rounded-md self-start mt-2 transition"
            >
              + Add Mission Point
            </button>
          </div>
        </div>
      </div>

      {/* Faculty Section */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaUserTie className="text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800">Faculty Members</h2>
          </div>
          <button
            onClick={() => setIsFacultyModalOpen(true)}
            className="bg-primary hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            + Add New Faculty
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
            {faculty.map((member, index) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="relative flex items-center gap-4 bg-gradient-to-r from-primary-50 via-white to-white p-5 rounded-2xl border-l-8 border-primary-600 shadow-md hover:shadow-xl hover:scale-[1.02]"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gray-100 border-4 border-primary-200 flex items-center justify-center overflow-hidden shadow">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <FaUserTie className="text-4xl text-primary-400" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{member.name}</h3>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">{member.designation}</span>
                  </div>
                  <p className="text-gray-500 text-sm truncate">{member.qualification}</p>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-2 ml-2 items-center">
                  <button
                    onClick={() => moveFacultyUp(index)}
                    disabled={index === 0}
                    className="text-base bg-gray-200 hover:bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-40 transition"
                    aria-label="Move up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveFacultyDown(index)}
                    disabled={index === faculty.length - 1}
                    className="text-base bg-gray-200 hover:bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-40 transition"
                    aria-label="Move down"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemoveFaculty(member.id)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center mt-2 shadow"
                    aria-label="Remove faculty"
                    title="Remove"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {isFacultyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Add Faculty Member</h2>
            <form onSubmit={handleAddFaculty}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newFacultyName}
                    onChange={(e) => setNewFacultyName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="qualification"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Qualification
                  </label>
                  <input
                    type="text"
                    id="qualification"
                    value={newFacultyQualification}
                    onChange={(e) =>
                      setNewFacultyQualification(e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="designation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Designation
                  </label>
                  <input
                    type="text"
                    id="designation"
                    value={newFacultyDesignation}
                    onChange={(e) => setNewFacultyDesignation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="image"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleNewFacultyImageChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {newFacultyImagePreview && (
                    <img
                      src={newFacultyImagePreview}
                      alt="Preview"
                      className="mt-4 w-32 h-32 object-cover rounded-md"
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsFacultyModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400"
                >
                  {isUploading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg shadow-lg font-semibold text-lg transition duration-200 flex items-center z-50"
        aria-label="Save changes"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default Edit;