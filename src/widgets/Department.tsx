"use client";
import { FaEye } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "@lib/firebase"; // adjust path to your firebase config
import { useRouter } from "next/navigation";
import Link from "next/link";
// import { Application } from "../common/interface/interface"

interface Department {
  id: string;
  name?: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  generatedId?: string;
  createdAt?: {
    toDate: () => Date;
  };
  email?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [departmentsFound, setDepartmentsFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      await addDoc(collection(db, "departments"), {
        name: departmentName,
        code: departmentCode,
        createdAt: serverTimestamp(),
      });
      router.push(`/department/edit/${departmentCode}`);
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
        <div className="bg-white w-full md:w-[25vw] border-2 border-dashed border-blue-400 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-blue-50 transition">
          <p className="text-blue-600 font-semibold mb-2 text-center">
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
  {allDepartments.slice(0, 5).map((dept, index) => {
    const code = dept.code || dept.generatedId || "N/A";
    // Placeholder for department image, replace with dept.image if available
    const imageUrl = "/logo.png";
    return (
      <div
        key={dept.id || index}
        className="bg-white rounded-2xl p-0 border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-400 flex flex-col group transform hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
      >
        {/* Department Image Preview */}
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={dept.name || "Department"}
            className="object-cover w-full h-full rounded-t-2xl"
          />
        </div>
        {/* Department Info */}
        <div className="flex flex-col flex-grow p-6">
          <h3 className="text-xl font-bold text-blue-700 mb-1 group-hover:text-primary-700 transition-colors duration-200 truncate">
            {dept.name ||
              (dept?.firstName ? (
                <>
                  {dept.firstName} {dept.lastName}
                </>
              ) : (
                "N/A"
              ))}
          </h3>
          <p className="text-gray-500 text-sm mb-1 truncate">
            <span className="font-medium text-gray-700">Department Code:</span> {code}
          </p>
          <p className="text-gray-400 text-xs mb-4">
            <span className="font-medium text-gray-500">Created on:</span> {dept.createdAt?.toDate().toLocaleString() || "N/A"}
          </p>
          <div className="flex justify-end space-x-3 mt-auto">
            <Link 
              href={`/dashboard/department/edit/${encodeURIComponent(code)}`}
              className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-lg shadow-sm hover:from-primary-100 hover:to-primary-200 hover:text-primary-700 font-semibold transition-all duration-200 border border-gray-200 flex items-center gap-1"
            >
              <FaPen />
              Edit
            </Link>
            <Link 
              href={`/dashboard/department/${encodeURIComponent(code)}`}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm flex items-center gap-1"
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
    </div>
  );
}
