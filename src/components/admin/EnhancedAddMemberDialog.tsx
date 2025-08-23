'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { NewTeamMember } from '@/lib/team';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const roles = ['Admin', 'Manager', 'Editor', 'Reviewer', 'Contributor'] as const;

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  uid: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(roles),
  createNewUser: z.boolean().default(false),
}).refine((data) => {
  if (data.createNewUser) {
    return data.password && data.password.length >= 6;
  }
  return data.uid && data.uid.length > 0;
}, {
  message: "Either provide a UID for existing user or password (min 6 chars) for new user",
  path: ["password"],
});

type FormValues = z.infer<typeof formSchema>;

interface EnhancedAddMemberDialogProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnhancedAddMemberDialog({ onOpenChange, onSuccess }: EnhancedAddMemberDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      uid: '',
      password: '',
      role: 'Contributor',
      createNewUser: false,
    },
  });

  const createNewUser = form.watch('createNewUser');

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      let userUid = values.uid;

      // If creating a new user, call the Cloud Function
      if (values.createNewUser && values.password) {
        const createTeamUser = httpsCallable(functions, 'createTeamUser');
        const result = await createTeamUser({
          email: values.email,
          password: values.password,
        });
        
        const data = result.data as { uid: string };
        userUid = data.uid;

        toast({
          title: 'User Created',
          description: `New Firebase user created successfully with UID: ${userUid}`,
        });
      }

      if (!userUid) {
        throw new Error('No user UID available');
      }

      // Add the user to the teamMembers collection
      await setDoc(doc(db, 'teamMembers', userUid), {
        name: values.name,
        email: values.email,
        role: values.role,
        joinedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: `Team member '${values.name}' has been added successfully.${
          values.createNewUser 
            ? ` They can now login with email: ${values.email} and the password you provided.`
            : ''
        }`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      
      let errorMessage = "Failed to add team member. Please check your permissions.";
      
      if (error.code === 'functions/permission-denied') {
        errorMessage = "You don't have permission to create new users. Only admins can create team members.";
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = "Invalid email or password provided.";
      } else if (error.message?.includes('email-already-exists')) {
        errorMessage = "A user with this email already exists. Use 'Add Existing User' option instead.";
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Add a team member by creating a new account or adding an existing Firebase user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="createNewUser"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Create New User Account
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this to create a new Firebase account with email and password
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} disabled={isLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} disabled={isLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createNewUser ? (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters" 
                          {...field} 
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="uid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID (UID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase User UID" {...field} disabled={isLoading}/>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Find the UID in Firebase Console under Authentication
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createNewUser ? 'Create & Add Member' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
