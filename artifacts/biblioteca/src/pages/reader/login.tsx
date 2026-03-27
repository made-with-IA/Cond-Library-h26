import React from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useReaderLogin } from "@workspace/api-client-react";
import { useReaderAuth } from "@/contexts/AuthContext";
import { Card, CardContent, Button, Input, Label } from "@/components/ui";
import { BookOpen, AlertCircle } from "lucide-react";
import { STRINGS } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function ReaderLogin() {
  const [, setLocation] = useLocation();
  const { login } = useReaderAuth();
  const loginMutation = useReaderLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user);
          setLocation("/reader/dashboard");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-xl mb-6">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">{STRINGS.reader.loginTitle}</h1>
          <p className="text-muted-foreground">Sign in to access your personal library portal.</p>
        </div>

        <Card className="border-none shadow-xl shadow-black/5">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {loginMutation.isError && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  Invalid email or password.
                </div>
              )}
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="carlos@email.com" {...register("email")} />
                {errors.email && <p className="text-destructive text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="password" className="mb-0">Password</Label>
                </div>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-destructive text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full h-12 text-base" isLoading={loginMutation.isPending}>
                Sign In
              </Button>
            </form>
            
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account? <span className="text-foreground font-medium">Contact your building administrator.</span>
            </div>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm font-medium text-primary hover:underline">
                &larr; Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
