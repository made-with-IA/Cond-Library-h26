import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateBook, useUpdateBook, useGetBook, useGeminiBookSearch } from "@workspace/api-client-react";
import { Sparkles, ArrowLeft, Save, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Input, Textarea, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  genre: z.string().min(1, "Genre is required"),
  isbn: z.string().optional(),
  publishedYear: z.coerce.number().optional().or(z.literal("")),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function AdminBookForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: initialData, isLoading: loadingInit } = useGetBook(Number(id), { query: { enabled: isEdit, queryKey: ["getBook", Number(id)] } });
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const aiSearchMutation = useGeminiBookSearch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", author: "", genre: "", isbn: "", publishedYear: undefined, description: "", imageUrl: ""
    }
  });

  useEffect(() => {
    if (isEdit && initialData) {
      form.reset({
        title: initialData.title,
        author: initialData.author,
        genre: initialData.genre,
        isbn: initialData.isbn || "",
        publishedYear: initialData.publishedYear || undefined,
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
      });
    }
  }, [isEdit, initialData, form]);

  const [aiQuery, setAiQuery] = React.useState("");

  const handleAiSearch = () => {
    if (!aiQuery) return;
    aiSearchMutation.mutate({ data: { query: aiQuery } }, {
      onSuccess: (data) => {
        toast({ title: "AI Data retrieved", description: "Form auto-filled with suggestions." });
        const current = form.getValues();
        form.reset({
          ...current,
          title: data.title || current.title,
          author: data.author || current.author,
          genre: data.genre || current.genre,
          isbn: data.isbn || current.isbn,
          publishedYear: data.publishedYear || current.publishedYear,
          description: data.description || current.description,
          imageUrl: data.imageUrl || current.imageUrl,
        });
      },
      onError: () => toast({ title: "AI Search failed", variant: "destructive" })
    });
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const payload = {
      ...data,
      publishedYear: data.publishedYear ? Number(data.publishedYear) : undefined,
      isbn: data.isbn || undefined,
      description: data.description || undefined,
      imageUrl: data.imageUrl || undefined,
    };

    if (isEdit) {
      updateMutation.mutate({ id: Number(id), data: payload }, {
        onSuccess: () => { toast({ title: "Book updated" }); setLocation("/admin/books"); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Book created" }); setLocation("/admin/books"); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
      });
    }
  };

  if (isEdit && loadingInit) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/books")} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          {isEdit ? "Edit Book" : "Add New Book"}
        </h1>
      </div>

      {!isEdit && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 shadow-sm mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <Label className="text-indigo-900 font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Auto-fill with AI
              </Label>
              <Input 
                placeholder="Enter a book title or ISBN to search..." 
                className="bg-white border-indigo-200 focus:ring-indigo-500"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
              />
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto h-11 shrink-0 gap-2"
              onClick={handleAiSearch}
              isLoading={aiSearchMutation.isPending}
            >
               Search & Fill
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-lg shadow-black/5 border-border/50">
          <CardContent className="p-8 space-y-6">
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input {...form.register("title")} />
                {form.formState.errors.title && <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Author <span className="text-destructive">*</span></Label>
                <Input {...form.register("author")} />
                {form.formState.errors.author && <p className="text-destructive text-xs">{form.formState.errors.author.message}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Genre <span className="text-destructive">*</span></Label>
                <Input {...form.register("genre")} placeholder="e.g., Fiction, Sci-Fi" />
                {form.formState.errors.genre && <p className="text-destructive text-xs">{form.formState.errors.genre.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>ISBN</Label>
                <Input {...form.register("isbn")} />
              </div>
              <div className="space-y-2">
                <Label>Published Year</Label>
                <Input type="number" {...form.register("publishedYear")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input {...form.register("imageUrl")} placeholder="https://..." />
              {form.formState.errors.imageUrl && <p className="text-destructive text-xs">{form.formState.errors.imageUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} className="h-32" />
            </div>

            <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setLocation("/admin/books")}>Cancel</Button>
              <Button type="submit" size="lg" className="px-8 gap-2" isLoading={createMutation.isPending || updateMutation.isPending}>
                <Save size={18} /> {isEdit ? "Update Book" : "Save Book"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
