import React, { useState } from "react";
import { useListUsers, useCreateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Search, Plus, User, Mail, Home, ChevronRight } from "lucide-react";
import { Card, Button, Input, Badge, Modal, Label, Select } from "@/components/ui";
import { getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  block: z.string().optional(),
  house: z.string().optional(),
});

export default function AdminReaders() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListUsers({ search: search || undefined, limit: 100 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const createMutation = useCreateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema)
  });

  const onSubmit = (formData: z.infer<typeof userSchema>) => {
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Reader registered successfully" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setIsModalOpen(false);
        form.reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Manage Readers</h1>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={18} /> Register Reader
        </Button>
      </div>

      <Card className="p-4 shadow-sm border-border/50">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search by name, email, apt..." 
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading readers...</td></tr>
              ) : data?.users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No readers found.</td></tr>
              ) : (
                data?.users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link href={`/admin/readers/${user.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Mail size={12}/> {user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Home size={12}/> {user.block ? `${user.block} - ` : ''}{user.house || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor('user', user.status)}>{user.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/readers/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight size={16} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Reader">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Block/Building</Label>
              <Input {...form.register("block")} />
            </div>
            <div className="space-y-2">
              <Label>Apt/House #</Label>
              <Input {...form.register("house")} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-6">
             <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button type="submit" isLoading={createMutation.isPending}>Register Reader</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
