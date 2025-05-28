import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordValid = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const allValid = Object.values(passwordValid).every(Boolean);
  const passwordsMatch = password === confirm;

  const strength = useMemo(() => {
    const score = Object.values(passwordValid).filter(Boolean).length;
    if (score <= 2) return "Weak";
    if (score === 3 || score === 4) return "Moderate";
    return "Strong";
  }, [passwordValid]);

  const strengthColor = {
    Weak: "text-red-600",
    Moderate: "text-yellow-600",
    Strong: "text-green-600",
  }[strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allValid) {
      setError("Password doesn't meet strength requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Reset failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>

      {success ? (
        <p className="text-green-600">✅ Password updated! Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <p className={clsx("text-sm mt-1", strengthColor)}>
                Strength: {strength}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {!passwordsMatch && confirm && (
              <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>Password must include:</p>
            <ul className="list-disc list-inside">
              <li className={passwordValid.length ? "text-green-700" : ""}>Min 8 characters</li>
              <li className={passwordValid.upper ? "text-green-700" : ""}>Uppercase letter</li>
              <li className={passwordValid.lower ? "text-green-700" : ""}>Lowercase letter</li>
              <li className={passwordValid.number ? "text-green-700" : ""}>Number</li>
              <li className={passwordValid.symbol ? "text-green-700" : ""}>Symbol</li>
            </ul>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={!allValid || !passwordsMatch}
          >
            Reset Password
          </Button>
        </form>
      )}
    </div>
  );
}
