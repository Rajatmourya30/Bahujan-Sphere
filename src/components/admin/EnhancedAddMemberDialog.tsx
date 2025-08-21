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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewTeamMember, TeamMemberRole } from '@/lib/team';
import { ROLE_DEFINITIONS, getAvailableRolesForUser } from '@/lib/roles';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Shield, Users, Eye, Edit, FileText } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const createTeamUser = httpsCallable(functions, 'createTeamUser');

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
  role: z.enum(['Admin', 'Manager', 'Editor', 'Reviewer', 'Contributor'] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface EnhancedAddMemberDialogProps {
  onOpenChange: (open: boolean) => void;
  onSave: (newMember: NewTeamMember, uid: string) => Promise<void>;
  currentUserRole: TeamMemberRole;
}

const getRoleIcon = (role: TeamMemberRole) => {
  switch (role) {
    case 'Admin':
      return <Shield className="h-4 w-4" />;
    case 'Manager':
      return <Users className="h-4 w-4" />;
    case 'Editor':
      return <Edit className="h-4 w-4" />;
    case 'Reviewer':
      return <Eye className="h-4 w-4" />;
    case 'Contributor':
      return <FileText className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

export function EnhancedAddMemberDialog({ onOpenChange, onSave, currentUserRole }: EnhancedAddMemberDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>('Contributor');

  const availableRoles = getAvailableRolesForUser(currentUserRole);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Contributor',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Step 1: Create user and set claims via the Cloud Function
      const result: any = await createTeamUser({ 
        email: values.email, 
        password: values.password,
        role: values.role
      });
      const { uid } = result.data;

      if (!uid) {
        throw new Error('Failed to create user: UID was not returned.');
      }

      // Step 2: Call the onSave prop to handle Firestore document creation
      await onSave({
        name: values.name,
        email: values.email,
        role: values.role,
      }, uid);

      toast({
        title: 'Team Member Added Successfully',
        description: `${values.name} has been added as a ${values.role} with appropriate permissions.`,
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: 'User Creation Failed',
        description: error.message || "An unexpected error occurred. This could be due to an existing email or a server-side issue.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    
    // Fill the rest randomly
    for (let i = 3; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    form.setValue('password', password);
  };

  const roleDefinition = ROLE_DEFINITIONS[selectedRole];

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Create a new team member account with role-based permissions. They will receive login credentials to access the admin dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormDescription>
                        This will be their login email address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="password" placeholder="Enter secure password" {...field} disabled={isLoading}/>
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generatePassword}
                          disabled={isLoading}
                        >
                          Generate
                        </Button>
                      </div>
                      <FormDescription>
                        Must be at least 8 characters with uppercase, lowercase, and number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={(value: TeamMemberRole) => {
                          field.onChange(value);
                          setSelectedRole(value);
                        }} 
                        defaultValue={field.value} 
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(role)}
                                {role}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        You can only assign roles at or below your current level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getRoleIcon(selectedRole)}
                  {roleDefinition.name} Role
                </CardTitle>
                <CardDescription>
                  {roleDefinition.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {roleDefinition.permissions.map(permission => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Access Level: {roleDefinition.level}/5
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Team Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
