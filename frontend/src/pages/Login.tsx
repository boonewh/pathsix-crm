import { FormWrapper } from "@/components/ui/FormWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/authContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        login(data.token);         // Save token to localStorage + context
        navigate("/dashboard");    // Redirect to dashboard
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      alert("Server error");
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <FormWrapper onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-center text-foreground mb-4">
          Login to PathSix CRM
        </h1>

        <div className="flex justify-center">
          <div className="w-full max-w-sm space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              Log In
            </Button>

            <div className="text-right mt-1">
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>
        </div>
      </FormWrapper>
    </div>
  );
}
