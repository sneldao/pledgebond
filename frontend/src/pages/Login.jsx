import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VaultSeal from "@/components/VaultSeal";
import { api } from "@/lib/api";
import { setAuthTokens } from "@/lib/auth";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login({ email, password });
      setAuthTokens(response);
      toast.success("Welcome back!");
      navigate("/explore");
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.sendMagicLink(email);
      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to send magic link";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #FBF2E3 0%, #F2E6D1 100%)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <VaultSeal status="pending" pledgeRatio={0.5} size={120} style="burgundy" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-ink mb-2">Welcome Back</h1>
          <p className="text-ink-600">Sign in to continue your pledge</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-wax">
          {!magicLinkMode ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-parchment-300 rounded-md focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-parchment-300 rounded-md focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-wax text-white py-3 rounded-md font-medium hover:bg-wax-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setMagicLinkMode(true)}
                  className="text-gold hover:text-gold-dark font-medium"
                  disabled={loading}
                >
                  Send Magic Link Instead
                </button>
              </div>
            </>
          ) : (
            <>
              {!magicLinkSent ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-parchment-300 rounded-md focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                      placeholder="your@email.com"
                      disabled={loading}
                    />
                  </div>

                  <button
                    onClick={handleMagicLink}
                    disabled={loading}
                    className="w-full bg-wax text-white py-3 rounded-md font-medium hover:bg-wax-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Magic Link"}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setMagicLinkMode(false)}
                      className="text-gold hover:text-gold-dark font-medium"
                      disabled={loading}
                    >
                      Back to Password Login
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl">📧</div>
                  <p className="text-ink-600">
                    We've sent a magic link to <strong>{email}</strong>.<br />
                    Click the link in the email to sign in.
                  </p>
                  <button
                    onClick={() => {
                      setMagicLinkSent(false);
                      setMagicLinkMode(false);
                    }}
                    className="text-gold hover:text-gold-dark font-medium"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mt-6 text-center text-sm text-ink-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-gold hover:text-gold-dark font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
