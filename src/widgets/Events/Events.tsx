"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@lib/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl?: string;
  link?: string;
  order: number;
  isActive: boolean;
}

const EventManager = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState<Omit<EventItem, "id">>({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    imageUrl: "",
    link: "",
    order: 0,
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Firebase references
  const eventsRef = collection(db, "website_config", "events", "items");

  // Fetch events
  useEffect(() => {
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const items = snapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          title: doc.data().title || "",
          date: doc.data().date || "",
          time: doc.data().time || "",
          location: doc.data().location || "",
          description: doc.data().description || "",
          imageUrl: doc.data().imageUrl || "",
          link: doc.data().link || "",
          order: doc.data().order || 0,
          isActive: doc.data().isActive ?? true,
        })
      );
      setEvents(items.sort((a, b) => a.order - b.order));
      setLoading(false);
    });

    return () => unsubscribeEvents();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setNewEvent((prev) => ({ ...prev, date: formattedDate }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a storage reference
      const storageRef = ref(
        storage,
        `events/${selectedFile.name}_${Date.now()}`
      );

      // Upload file (no progress tracking)
      await uploadBytes(storageRef, selectedFile);
      setUploadProgress(100); // Set to 100% when complete

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update form with image URL
      setNewEvent((prev) => ({ ...prev, imageUrl: downloadURL }));
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title || !newEvent.date || !newEvent.description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(eventsRef, editingId), {
          ...newEvent,
          order: parseInt(newEvent.order as any) || 0,
        });
      } else {
        const newEventRef = doc(eventsRef);
        await setDoc(newEventRef, {
          ...newEvent,
          order: parseInt(newEvent.order as any) || events.length,
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      imageUrl: "",
      link: "",
      order: events.length,
      isActive: true,
    });
    setSelectedDate(null);
    setEditingId(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startEditing = (event: EventItem) => {
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      imageUrl: event.imageUrl || "",
      link: event.link || "",
      order: event.order,
      isActive: event.isActive,
    });
    setEditingId(event.id);
    // Parse the existing date for the date picker
    if (event.date) {
      const dateParts = event.date.split(" ");
      if (dateParts.length === 3) {
        const date = new Date(event.date);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    }
  };

  const toggleEventStatus = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(eventsRef, id), { isActive: !currentStatus });
  };

  const deleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteDoc(doc(eventsRef, id));
    }
  };

  if (loading) return <div className="text-center py-8">Loading events...</div>;

  return (
    <div className="w-full">
      {/* Event Management Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Manage Events</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                className="w-full p-2 border rounded"
                placeholderText="Select date"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Time (hh:mm am/pm) *
              </label>
              <input
                type="text"
                name="time"
                value={newEvent.time}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="2:30 pm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="College Auditorium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                name="order"
                value={newEvent.order}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Image
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1 p-2 border rounded"
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={uploadImage}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              {newEvent.imageUrl && (
                <div className="mt-2">
                  <span className="text-sm text-green-600">
                    Image uploaded successfully!
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={newEvent.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link URL</label>
            <input
              type="url"
              name="link"
              value={newEvent.link}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={newEvent.isActive}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              Active
            </label>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingId ? "Update Event" : "Add Event"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {events
          .filter((e) => e.isActive)
          .map((event) => (
            <div
              key={event.id}
              className="border-b border-gray-200 pb-6 last:border-0 group relative"
            >
              <div className="absolute right-0 top-0 flex space-x-2">
                <button
                  onClick={() => startEditing(event)}
                  className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleEventStatus(event.id, event.isActive)}
                  className={`p-1 ${
                    event.isActive
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-500 hover:bg-gray-600"
                  } text-white rounded`}
                  title={event.isActive ? "Active" : "Inactive"}
                >
                  {event.isActive ? "✓" : "✗"}
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-2xl font-bold text-gray-800">
                {event.title}
              </h2>
              <div className="flex items-center text-sm text-gray-500 mt-1 mb-3 space-x-4">
                <span>{event.date}</span>
                <span className="h-1 w-1 bg-gray-400 rounded-full"></span>
                <span>{event.time}</span>
                <span className="h-1 w-1 bg-gray-400 rounded-full"></span>
                <span>{event.location}</span>
              </div>
              <p className="text-gray-600">{event.description}</p>
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Read More →
                </a>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default EventManager;
