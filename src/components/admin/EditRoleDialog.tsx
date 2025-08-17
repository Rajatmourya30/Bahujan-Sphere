
'use client';

import { useState } from 'react';
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
import type { TeamMember } from './TeamMemberTable';
import { Label } from '../ui/label';

interface EditRoleDialogProps {
  member: TeamMember;
  onOpenChange: (open: boolean) => void;
  onSave: (newRole: TeamMember['role']) => void;
}

const roles: TeamMember['role'][] = ['Admin', 'Editor', 'Reviewer', 'Contributor'];

export function EditRoleDialog({ member, onOpenChange, onSave }: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<TeamMember['role']>(member.role);

  const handleSave = () => {
    onSave(selectedRole);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Role for {member.name}</DialogTitle>
          <DialogDescription>
            Select a new role for this team member. This will change their permissions in the admin dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="role-select">Role</Label>
          <Select value={selectedRole} onValueChange={(value: TeamMember['role']) => setSelectedRole(value)}>
            <SelectTrigger id="role-select" className="w-full mt-2">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
