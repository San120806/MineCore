"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Login Page
// ─────────────────────────────────────────────────────────────────────────────

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pickaxe, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      toast.success("Successfully signed in to MineCore!");
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      console.error("Login error details:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password";
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30">
          <Pickaxe className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            MineCore
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Smart Mining Operations Platform
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter your credentials to access the operations center.
          </p>
        </div>

        <Separator />

        {serverError && (
          <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive font-medium animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <FormField
            label="Email address"
            id="login-email"
            type="email"
            placeholder="ops@minecore.io"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "transition-colors placeholder:text-muted-foreground focus-visible:outline-none",
                  "focus-visible:ring-1 focus-visible:ring-ring pr-10",
                  errors.password &&
                    "border-destructive focus-visible:ring-destructive/30",
                )}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="login-remember"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              {...register("rememberMe")}
            />
            <Label
              htmlFor="login-remember"
              className="text-sm font-normal text-muted-foreground"
            >
              Remember me for 7 days
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            id="login-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        MineCore v1.0 · Secure Operations Platform
      </p>
    </div>
  );
}
