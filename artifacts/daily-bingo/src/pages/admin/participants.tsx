import { AdminLayout } from "@/components/layout";
import {
  useListParticipants,
  useCreateParticipant,
  useDeleteParticipant,
  getListParticipantsQueryKey,
  ParticipantInputRole,
} from "@/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Eye, Trash2, ShieldCheck, User } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const newUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["participant", "admin"]),
});

export default function AdminParticipants() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: me } = useAuth();

  const { data: users, isLoading } = useListParticipants({
    query: { queryKey: getListParticipantsQueryKey() }
  });

  const createMutation = useCreateParticipant({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListParticipantsQueryKey() });
        setIsDialogOpen(false);
        form.reset();
        toast({
          title: `${data.role === "admin" ? "Admin" : "Participant"} created`,
          description: `${data.name} (@${data.username}) was added successfully.`,
        });
      },
      onError: () => toast({ title: "Error", description: "Failed to create user.", variant: "destructive" }),
    }
  });

  const deleteMutation = useDeleteParticipant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListParticipantsQueryKey() });
        toast({ title: "User deleted" });
      },
      onError: () => toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" }),
    }
  });

  const form = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", username: "", password: "", role: "participant" },
  });

  const onSubmit = (values: z.infer<typeof newUserSchema>) => {
    createMutation.mutate({
      data: {
        name: values.name,
        username: values.username,
        password: values.password,
        role: values.role as ParticipantInputRole,
      }
    });
  };

  const admins = users?.filter(u => u.role === "admin") ?? [];
  const participants = users?.filter(u => u.role === "participant") ?? [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Users</h1>
            <p className="text-muted-foreground mt-1">
              {admins.length} admin{admins.length !== 1 ? "s" : ""} · {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create an account for a new admin or participant.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. Maria Lopez" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g. maria" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="At least 6 characters" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="participant">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>Participant</span>
                              <span className="text-muted-foreground text-xs">— bingo card & reflections</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-primary" />
                              <span>Admin</span>
                              <span className="text-muted-foreground text-xs">— full admin panel access</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Create User"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10"><Spinner /></div>
        ) : (
          <div className="space-y-6">
            {/* Admins section */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Admins
              </h2>
              <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No admins found.</TableCell></TableRow>
                    ) : admins.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name}
                          {u.id === me?.id && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {u.id !== me?.id && (
                            <DeleteUserButton
                              name={u.name}
                              onConfirm={() => deleteMutation.mutate({ id: u.id })}
                              isPending={deleteMutation.isPending}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Participants section */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Participants
              </h2>
              <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No participants yet.</TableCell></TableRow>
                    ) : participants.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/participants/${u.id}`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                          >
                            <Eye className="w-4 h-4 mr-1.5" /> View
                          </Link>
                          <DeleteUserButton
                            name={u.name}
                            onConfirm={() => deleteMutation.mutate({ id: u.id })}
                            isPending={deleteMutation.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function DeleteUserButton({ name, onConfirm, isPending }: { name: string; onConfirm: () => void; isPending: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this user and all their data (bingo cards, reflections). This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
