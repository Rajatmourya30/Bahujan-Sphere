export type TeamMemberRole = 'Admin' | 'Manager' | 'Editor' | 'Reviewer' | 'Contributor';

export interface RolePermissions {
  name: string;
  description: string;
  permissions: string[];
  color: 'default' | 'secondary' | 'outline' | 'destructive';
  level: number; // Higher number = more permissions
}

export const ROLE_DEFINITIONS: Record<TeamMemberRole, RolePermissions> = {
  'Admin': {
    name: 'Admin',
    description: 'Full system access with all administrative privileges',
    permissions: [
      'Full Access',
      'Manage Team Members',
      'System Configuration',
      'User Management',
      'Content Management',
      'Analytics Access',
      'Financial Data Access'
    ],
    color: 'default',
    level: 5
  },
  'Manager': {
    name: 'Manager',
    description: 'Senior role with content and team oversight capabilities',
    permissions: [
      'Submit Content',
      'Approve Submissions',
      'Edit Content',
      'Manage Events',
      'View Analytics',
      'Moderate Content'
    ],
    color: 'default',
    level: 4
  },
  'Editor': {
    name: 'Editor',
    description: 'Content creation and editing with approval rights',
    permissions: [
      'Submit Events',
      'Approve Submissions',
      'Edit Events',
      'Manage Reading Room',
      'Upload Content'
    ],
    color: 'secondary',
    level: 3
  },
  'Reviewer': {
    name: 'Reviewer',
    description: 'Review and provide feedback on submitted content',
    permissions: [
      'Review Submissions',
      'Suggest Edits',
      'Comment on Content',
      'View Drafts'
    ],
    color: 'outline',
    level: 2
  },
  'Contributor': {
    name: 'Contributor',
    description: 'Basic content submission with limited access',
    permissions: [
      'Submit Events for Review',
      'View Own Submissions',
      'Basic Profile Access'
    ],
    color: 'destructive',
    level: 1
  }
};

export function canUserManageRole(userRole: TeamMemberRole, targetRole: TeamMemberRole): boolean {
  const userLevel = ROLE_DEFINITIONS[userRole].level;
  const targetLevel = ROLE_DEFINITIONS[targetRole].level;
  
  // Users can only manage roles at their level or below (except they can't manage their own role)
  return userLevel > targetLevel;
}

export function getAvailableRolesForUser(userRole: TeamMemberRole): TeamMemberRole[] {
  const userLevel = ROLE_DEFINITIONS[userRole].level;
  
  return Object.entries(ROLE_DEFINITIONS)
    .filter(([_, roleData]) => roleData.level <= userLevel)
    .map(([role, _]) => role as TeamMemberRole);
}

export function getRoleHierarchy(): TeamMemberRole[] {
  return Object.entries(ROLE_DEFINITIONS)
    .sort(([_, a], [__, b]) => b.level - a.level)
    .map(([role, _]) => role as TeamMemberRole);
}
