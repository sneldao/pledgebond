import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VaultSeal from "@/components/VaultSeal";
import { api } from "@/lib/api";
import { setAuthTokens } from "@/lib/auth";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("funder");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.register({
        email,
        password,
        display_name: displayName,
        role,
      });
      setAuthTokens(response);
      toast.success("Welcome to PledgeBond!");
      navigate("/explore");
    } catch (error) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #FBF2E3 0%, #F2E6D1 100%)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <VaultSeal status="pending" pledgeRatio={0.3} size={120} style="gold" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-ink mb-2">Create Account</h1>
          <p className="text-ink-600">Join the pledge community</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-wax">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-parchment-300 rounded-md focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                placeholder="Your name"
                disabled={loading}
              />
            </div>

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
              <p className="text-xs text-ink-600 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-parchment-300 rounded-md focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value="funder">Funder - Create and fund pledges</option>
                <option value="participant">Participant - Join and complete pledges</option>
                <option value="both">Both - Full access</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-ink py-3 rounded-md font-medium hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-600">
            Already have an account?{" "}
            <Link to="/login" className="text-gold hover:text-gold-dark font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
