import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [oobCode, setOobCode] = useState("");
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Get oobCode from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    const code = queryParams.get("oobCode");

    // Check if the mode is resetPassword or action (some emails might use 'action')
    if ((mode === "resetPassword" || mode === "action") && code) {
      setOobCode(code);

      // Verify the code
      const verifyCode = async () => {
        try {
          setLoading(true);
          const email = await verifyPasswordResetCode(auth, code);
          setEmail(email);
          setValidCode(true);
        } catch (error) {
          console.error("Error verifying reset code:", error);
          setError(
            "Invalid or expired password reset link. Please request a new one."
          );
          setValidCode(false);
        } finally {
          setLoading(false);
        }
      };

      verifyCode();
    } else {
      setError(
        "No valid reset code found in URL. Please request a new password reset link."
      );
      setValidCode(false);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      setMessage("");
      setLoading(true);

      // Reset password
      await confirmPasswordReset(auth, oobCode, newPassword);

      setMessage(
        "Password has been reset successfully. You can now sign in with your new password."
      );
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);

      if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else if (error.code === "auth/invalid-action-code") {
        setError(
          "The reset link is invalid or has expired. Please request a new one."
        );
      } else {
        setError(
          error.message || "Failed to reset password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !validCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-30 w-auto rounded-full"
            src="/eLogo1.png"
            alt="Enervisio Logo"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#1e386d]">
            Reset your password
          </h2>
          {validCode && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Create a new password for{" "}
              <span className="font-medium">{email}</span>
            </p>
          )}
        </div>

        {message && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {validCode ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="newPassword" className="sr-only">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="form-input rounded-md"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="form-input rounded-md"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center  px-4 py-2 rounded-md font-medium text-white bg-[#1e386d] hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex justify-center">
            <Link to="/forgot-password" className="btn-primary">
              Request New Reset Link
            </Link>
          </div>
        )}

        <div className="flex items-center justify-center">
          <Link
            to="/login"
            className="font-medium text-[#1e386d] hover:text-[#152951]"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
