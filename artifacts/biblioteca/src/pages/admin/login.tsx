import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAdminAuth } from "@/contexts/AuthContext";
import { Card, CardContent, Button, Input, Label } from "@/components/ui";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { STRINGS } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAdminAuth();
  const loginMutation = useAdminLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.admin);
          setLocation("/admin/dashboard");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 text-white">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-white/10 text-white shadow-xl mb-6 backdrop-blur-md border border-white/20">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 tracking-wide">{STRINGS.admin.loginTitle}</h1>
          <p className="text-gray-400">Restricted access area.</p>
        </div>

        <Card className="border-gray-800 bg-gray-800/50 shadow-2xl backdrop-blur-xl text-white">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {loginMutation.isError && (
                <div className="p-4 bg-red-500/20 text-red-200 border border-red-500/30 text-sm rounded-xl flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  Invalid credentials or unauthorized access.
                </div>
              )}
              
              <div>
                <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@biblioteca.com" 
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20 h-12"
                  {...register("email")} 
                />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20 h-12"
                  {...register("password")} 
                />
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full h-12 text-base bg-white text-gray-900 hover:bg-gray-200 shadow-white/10" isLoading={loginMutation.isPending}>
                Authenticate
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
