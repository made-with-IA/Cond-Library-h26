import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useReaderUpdateProfile, getReaderMeQueryKey } from "@workspace/api-client-react";
import { useReaderAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { User, Key, Save, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  password: z.string().min(6, "Minimum 6 characters").optional().or(z.literal("")),
}).refine(data => {
  if (data.password && !data.currentPassword) return false;
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"]
});

export default function ReaderProfile() {
  const { user } = useReaderAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useReaderUpdateProfile();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: user?.phone || "",
      currentPassword: "",
      password: ""
    }
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    // Strip empty strings to undefined
    const payload = {
      phone: data.phone || undefined,
      password: data.password || undefined,
      currentPassword: data.currentPassword || undefined,
    };

    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Profile updated successfully" });
          queryClient.invalidateQueries({ queryKey: getReaderMeQueryKey() });
          reset({ phone: payload.phone, currentPassword: "", password: "" });
        },
        onError: (err) => {
          toast({ title: "Failed to update", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2"><User className="text-primary" /> Personal Information</CardTitle>
              <CardDescription className="mt-1">Manage your account details and contact information.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Resident</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          
          {/* Read-only fields provided by admin */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-xl border border-border/50">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Full Name</Label>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email Address</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Block / Bldg</Label>
              <p className="font-medium">{user?.block || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Apartment / House</Label>
              <p className="font-medium">{user?.house || "—"}</p>
            </div>
            <div className="col-span-full text-xs text-muted-foreground mt-2">
              <AlertCircle size={14} className="inline mr-1 -mt-0.5" />
              To change these details, please contact the library administrator.
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h4 className="font-medium border-b border-border/50 pb-2">Editable Information</h4>
              <div>
                <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                <Input id="phone" placeholder="+55 11 99999-9999" {...register("phone")} className="max-w-md" />
                <p className="text-xs text-muted-foreground mt-1.5">Used to notify you when reservations are ready.</p>
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium border-b border-border/50 pb-2 flex items-center gap-2">
                <Key size={16} className="text-muted-foreground" /> Change Password
              </h4>
              <div className="grid sm:grid-cols-2 gap-4 max-w-md">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" {...register("currentPassword")} />
                  {errors.currentPassword && <p className="text-destructive text-xs mt-1">{errors.currentPassword.message}</p>}
                </div>
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button type="submit" size="lg" className="px-8 gap-2" isLoading={updateMutation.isPending}>
                <Save size={18} /> Save Changes
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
