"use client";
import { FaEye, FaPen, FaTrash } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  setDoc,
  doc,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { app } from "@lib/firebase"; // adjust path to your firebase config
import { useRouter } from "next/navigation";
import Link from "next/link";
import easyToast from "@components/CustomToast";
// import { Application } from "../common/interface/interface"

interface Department {
  id: string;
  name?: string;
  imageUrl?: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  generatedId?: string;
  createdAt?: {
    toDate: () => Date;
  };
  updatedAt?: {
    toDate: () => Date;
  };
  email?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [departmentsFound, setDepartmentsFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(
    null
  );
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const auth = getAuth(app);
  const db = getFirestore(app);
  const router = useRouter();

  useEffect(() => {
    const checkApplication = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "departments"));

        const querySnapshot = await getDocs(q);

        const departments: Department[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Department[];
        // Store all applications
        setAllDepartments(departments);

        // If you still want to store the latest application separately
        if (departments.length > 0) {
          setAllDepartments(departments);
          setDepartmentsFound(true);
        } else {
          setDepartmentsFound(false);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
        console.log(allDepartments);
      }
    };

    checkApplication();
  }, [auth.currentUser, db]);

  const handleCreateNew = () => {
    setShowModal(true);
  };

  const handleOptionSelect = (option: string) => {
    setShowModal(false);
    router.push(`/`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!departmentName || !departmentCode) {
      // Here you can implement a user-facing error, e.g., a toast
      console.error("Department name and code are required.");
      return;
    }
    setLoading(true);
    try {
// Create department with `code` as document ID
        await setDoc(doc(db, "departments", departmentCode), {
          name: departmentName,
          code: departmentCode.toLowerCase(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

      router.push(`/dashboard/department/edit/${departmentCode}`);
    } catch (error) {
      console.error("Error creating new department:", error);
      // Handle error, e.g., show a toast notification
    } finally {
      setLoading(false);
      setShowModal(false);
      setDepartmentName("");
      setDepartmentCode("");
    }
  };

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (departmentToDelete) {
      try {
        await deleteDoc(doc(db, "departments", departmentToDelete.id));
        setAllDepartments(
          allDepartments.filter((d) => d.id !== departmentToDelete.id)
        );
        easyToast({ type: "success", message: "Department deleted successfully!" });
      } catch (error) {
        console.error("Error deleting document: ", error);
        easyToast({ type: "error", message: "Failed to delete department." });
      } finally {
        setShowDeleteModal(false);
        setDepartmentToDelete(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full items-center justify-center flex">
        Loading...
      </div>
    );
  }

  if (!departmentsFound) {
    return (
      <div className="flex flex-col items-center justify-center h-full relative">
        <p className="mb-4 text-lg">You Don't Have Any Departments.</p>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New
        </button>
        {showModal && (
        <div className="fixed inset-0 w-full h-full backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Department</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="departmentName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department Name
                </label>
                <input
                  type="text"
                  id="departmentName"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="departmentCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department Code
                </label>
                <input
                  type="text"
                  id="departmentCode"
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col h-full gap-4">
      <div className="">
        {/* Create New Application Card */}
        <div className="bg-white w-full md:w-[25vw] border-2 border-dashed border-primary-400 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-primary-50 transition">
          <p className="text-primary-600 font-semibold mb-2 text-center">
            Want to create a new Department?
          </p>
          <button
            onClick={() => {
              setShowModal(true);
            }} // <-- implement this function
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md mt-2"
          >
            Create New Department
          </button>
        </div>
      </div>
      <div className="">
        <span className="text-lg md:text-xl font-semibold">
          Departments
        </span>
      </div>
      <div className="grid mt-2 gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
        {allDepartments.map((dept, index) => {
          const code = dept.code || dept.generatedId || "N/A";
          const imageUrl = dept.imageUrl || "/logomain.png";
          return (
            <div
              key={dept.id || index}
              className="bg-white rounded-2xl p-0 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group transform hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
            >
              <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt={dept.name || "Department"}
                  className="object-contain w-full h-full rounded-t-2xl"
                />
              </div>
              <div className="flex flex-col flex-grow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors duration-200 truncate">
                  {dept.name ||
                    (dept?.firstName ? (
                      <>{dept.firstName}</>
                    ) : (
                      "N/A"
                    ))}
                </h3>
                <p className="text-gray-500 text-sm mb-2 truncate">
                  <span className="font-medium text-gray-700">
                    Department Code:
                  </span>{" "}
                  {code}
                </p>
                <div className="text-xs text-gray-400 space-y-1 mt-auto">
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {dept.createdAt?.toDate().toLocaleString() || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {dept.updatedAt?.toDate().toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleDeleteClick(dept)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors duration-200"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                  <Link
                    href={`/dashboard/department/edit/${encodeURIComponent(
                      code
                    )}`}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg shadow-sm hover:bg-primary-100 hover:text-primary-700 font-semibold transition-all duration-200 border border-gray-200 flex items-center gap-2"
                  >
                    <FaPen />
                    Edit
                  </Link>
                  <Link
                    href={`https://www.carmelpoly.in/departments/${encodeURIComponent(code)}`}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm flex items-center gap-2"
                  >
                    <FaEye />
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 w-full h-full backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Department</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="departmentName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department Name
                </label>
                <input
                  type="text"
                  id="departmentName"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="departmentCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department Code
                </label>
                <input
                  type="text"
                  id="departmentCode"
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Confirm Deletion
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete the department "
              {departmentToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
