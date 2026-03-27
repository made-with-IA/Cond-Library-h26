import React, { useState } from "react";
import { useListNotes, useCreateNote, useUpdateNote, useDeleteNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Megaphone, Info, FileWarning } from "lucide-react";
import { Card, Button, Input, Textarea, Label, Modal, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

const noteSchema = z.object({
  title: z.string().min(1, "Required"),
  content: z.string().min(1, "Required"),
  type: z.enum(["rule", "info", "announcement"]),
  active: z.boolean().default(true),
});

export default function AdminNotes() {
  const { data, isLoading } = useListNotes({ all: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { type: "announcement", active: true }
  });

  const openNew = () => {
    setEditingId(null);
    form.reset({ title: "", content: "", type: "announcement", active: true });
    setIsModalOpen(true);
  };

  const openEdit = (note: z.infer<typeof noteSchema> & { id: number }) => {
    setEditingId(note.id);
    form.reset({ title: note.title, content: note.content, type: note.type, active: note.active });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if(!confirm("Delete note?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Note deleted" });
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey({ all: true }) });
      }
    });
  };

  const onSubmit = (formData: z.infer<typeof noteSchema>) => {
    const action = editingId 
      ? updateMutation.mutateAsync({ id: editingId, data: formData })
      : createMutation.mutateAsync({ data: formData });

    action.then(() => {
      toast({ title: editingId ? "Note updated" : "Note created" });
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey({ all: true }) });
      setIsModalOpen(false);
    }).catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }));
  };

  const notes = data?.notes || [];

  const icons = {
    announcement: <Megaphone size={20} className="text-blue-500" />,
    info: <Info size={20} className="text-green-500" />,
    rule: <FileWarning size={20} className="text-orange-500" />
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Library Notes & Rules</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus size={18} /> Add Note
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           <div className="h-48 bg-white border border-border animate-pulse rounded-xl col-span-full" />
        ) : notes.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-white border border-dashed rounded-xl">
             No notes configured. Add announcements or rules to display on the homepage.
          </div>
        ) : (
          notes.map(note => (
            <Card key={note.id} className={!note.active ? "opacity-60 bg-gray-50" : "bg-white"}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    {icons[note.type as keyof typeof icons]}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(note)}>
                      <Edit2 size={14} className="text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(note.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-wider">{note.type}</Badge>
                  <h3 className="font-semibold text-lg line-clamp-1">{note.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{note.content}</p>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs font-medium">
                  <span className={note.active ? "text-green-600" : "text-gray-400"}>{note.active ? "● Active (Public)" : "○ Inactive (Hidden)"}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Note" : "New Note"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Note Type</Label>
            <select {...form.register("type")} className="flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="announcement">General Announcement</option>
              <option value="info">Information</option>
              <option value="rule">Library Rule</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea {...form.register("content")} className="h-32" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="active" {...form.register("active")} className="w-4 h-4 rounded text-primary" />
            <Label htmlFor="active" className="mb-0">Publish immediately to public homepage</Label>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-6">
             <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Note</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
