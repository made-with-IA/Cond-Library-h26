import React, { useState } from "react";
import { useListAdmins, useCreateAdmin, useDeleteAdmin, getListAdminsQueryKey } from "@workspace/api-client-react";
import { useAdminAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Card, Button, Input, Label, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

const adminSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 chars"),
});

export default function AdminUsers() {
  const { admin: currentAdmin } = useAdminAuth();
  const { data, isLoading } = useListAdmins();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const createMutation = useCreateAdmin();
  const deleteMutation = useDeleteAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema)
  });

  const handleDelete = (id: number) => {
    if (id === currentAdmin?.id) {
      toast({ title: "Cannot delete yourself", variant: "destructive" });
      return;
    }
    if(!confirm("Remove this administrator?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Admin removed" });
        queryClient.invalidateQueries({ queryKey: getListAdminsQueryKey() });
      }
    });
  };

  const onSubmit = (formData: z.infer<typeof adminSchema>) => {
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Administrator created" });
        queryClient.invalidateQueries({ queryKey: getListAdminsQueryKey() });
        setIsModalOpen(false);
        form.reset();
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="text-primary" /> Admin Security
        </h1>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={18} /> Add Admin
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {isLoading ? (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Loading admins...</td></tr>
              ) : (
                data?.admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{admin.name} {admin.id === currentAdmin?.id && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}</div>
                      <div className="text-muted-foreground text-xs mt-1">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(admin.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                       {admin.id !== currentAdmin?.id && (
                          <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(admin.id)}>
                            <Trash2 size={16} />
                          </Button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Administrator">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl text-sm mb-4">
            Warning: Administrators have full access to library data and settings.
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Initial Password</Label>
            <Input type="password" {...form.register("password")} />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-6">
             <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button type="submit" isLoading={createMutation.isPending}>Create Admin</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
