import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

const Login = () => {
  const { login, currentUser, error, setError } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Clear any errors when component mounts or unmounts
  useEffect(() => {
    setError("");
    return () => setError("");
  }, [setError]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setLoginError("");

    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setLoginError("Invalid email or password");
      } else if (error.code === "auth/too-many-requests") {
        setLoginError(
          "Too many failed login attempts. Please try again later."
        );
      } else if (error.message.includes("Too many failed login attempts")) {
        setLoginError(error.message);
      } else {
        setLoginError(error.message || "Failed to log in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      {" "}
      {/* Use h-screen and overflow-hidden */}
      {/* Left Side - Logo Section */}
      <div className="w-full md:w-1/2 bg-[#1e386d] flex items-center justify-center p-12">
        {" "}
        {/* Removed md:min-h-screen */}
        <img
          className="max-w-xs md:max-w-full h-auto"
          src="/eLogo1.png"
          alt="Enervisio Logo"
        />
      </div>
      {/* Right Side - Form Section */}
      {/* Added overflow-y-auto for potential content overflow on smaller heights, but primarily relying on h-screen parent */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        {" "}
        {/* Removed md:min-h-screen, added overflow-y-auto */}
        <div className="max-w-md w-full space-y-8">
          <div>
            {/* Removed logo from here */}
            <h2 className="mt-6 text-left text-3xl font-extrabold text-current-color-900">
              ElCor-Enervisio Administrator
            </h2>
            <p className="mt-2 text-left text-sm text-gray-600">
              Enter your Credentials to access the system.
            </p>
          </div>

          {(loginError || error) && (
            <div
              className="bg-[#dc3545] text-white p-3 rounded-md shadow-sm"
              role="alert"
            >
              <p>{loginError || error}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Removed -space-y-px and adjusted spacing */}
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* Email Icon */}
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email ? "border-[#dc3545]" : "border-gray-300"
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1e386d] focus:border-[#1e386d] sm:text-sm pl-10`} // Added padding for icon
                    placeholder="Enter your email address"
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <p
                    id="email-error"
                    className="mt-2 text-sm text-[#dc3545]"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* Lock Icon */}
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    {...register("password")}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password ? "border-[#dc3545]" : "border-gray-300"
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1e386d] focus:border-[#1e386d] sm:text-sm pl-10`} // Added padding for icon
                    placeholder="Enter your password"
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                </div>
                {errors.password && (
                  <p
                    id="password-error"
                    className="mt-2 text-sm text-[#dc3545]"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-start">
              {" "}
              {/* Changed justify-end to justify-start */}
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-[#1e386d] hover:text-[#152951]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#1e386d] hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d]" // Adjusted button styles
                aria-busy={loading ? "true" : "false"}
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
