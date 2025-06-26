"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { app } from "@lib/firebase";
import { useRouter } from "next/navigation";
import easyToast from "@components/CustomToast";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      easyToast({ message: "Login successful", type: "success" });
      router.push("/dashboard/home");
    } catch (error) {
      easyToast({ message: "Google sign-in failed", type: "error" });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      easyToast({ message: "Email and password required", type: "error" });
      return;
    }
    try {
      setIsSigningIn(true);
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      easyToast({
        message: "Login successful",
        desc: "Redirecting to dashboard",
        type: "success",
      });
      router.push("/dashboard/home");
    } catch (error) {
      console.log(error)
      easyToast({
        message: "Login failed",
        desc: "Check your credentials.",
        type: "error",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password ) {
      easyToast({ message: "All fields are required", type: "error" });
      return;
    }
    try {
      setIsSigningIn(true);
      const auth = getAuth(app);
      await createUserWithEmailAndPassword(auth, email, password);
      easyToast({
        message: "Account created",
        desc: "Redirecting to dashboard",
        type: "success",
      });
      router.push("/dashboard/home");
    } catch (error: any) {
      easyToast({
        message: "Sign-up failed",
        desc: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      easyToast({
        message: "Email required",
        desc: "Please enter your email to reset your password.",
        type: "error",
      });
      return;
    }

    try {
      setIsSendingReset(true);
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, resetEmail);
      easyToast({
        message: "Reset email sent",
        desc: "Check your inbox or spam folder.",
        type: "success",
      });
      setShowResetModal(false);
      setResetEmail("");
    } catch (error: any) {
      easyToast({
        message: "Reset failed",
        desc: error.message || "Could not send reset email",
        type: "error",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        router.push("/dashboard/home");
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-[5vw]">
      <Image
        src={"/Carmelpoly.png"}
        width={1000}
        height={1000}
        className="w-[25rem] mb-10"
        alt="Logo"
      />

      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setTab("signup")}
          className={`text-sm font-medium px-4 py-2 rounded-md ${
            tab === "signup" ? "bg-primary-500 text-white" : "bg-gray-200"
          }`}
        >
          Create Account
        </button>
        <button
          onClick={() => setTab("login")}
          className={`text-sm font-medium px-4 py-2 rounded-md ${
            tab === "login" ? "bg-primary-500 text-white" : "bg-gray-200"
          }`}
        >
          Login
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isSigningIn}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isSigningIn}
        />
        <button
          disabled={isSigningIn}
          onClick={tab === "login" ? handleLogin : handleSignUp}
          className={`bg-primary-500 text-white rounded-md py-3 text-sm hover:bg-primary-600 ${
            isSigningIn ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {isSigningIn
            ? "Please wait..."
            : tab === "login"
            ? "Login"
            : "Create Account"}
        </button>

        {tab === "login" && (
          <button
            onClick={() => setShowResetModal(true)}
            className="text-sm text-blue-600 mt-1 hover:underline text-start"
            disabled={isSigningIn}
          >
            Forgot password?
          </button>
        )}

        <div className="flex items-center gap-2 w-full mt-4">
          <hr className="flex-grow border-gray-300" />
          <span className="text-gray-400 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          disabled={isSigningIn}
          className={`flex items-center justify-center border border-gray-400 bg-white gap-3 py-3 rounded-md ${
            isSigningIn ? "opacity-70" : ""
          }`}
          onClick={handleGoogleSignIn}
        >
          <Image
            src={"/google.png"}
            width={1000}
            height={1000}
            className="w-[2rem]"
            alt="Google logo"
          />
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white w-full max-w-sm rounded-lg p-6 shadow-lg relative">
            <h2 className="text-lg font-semibold mb-2">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email to receive a reset link.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email address"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-gray-600 text-sm"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail("");
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="bg-primary-500 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-600"
                disabled={isSendingReset}
              >
                {isSendingReset ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
