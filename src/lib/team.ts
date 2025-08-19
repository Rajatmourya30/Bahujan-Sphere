
import type { Timestamp } from 'firebase/firestore';

export type TeamMemberRole = 'Admin' | 'Manager' | 'Editor' | 'Reviewer' | 'Contributor';

export interface TeamMember {
  name: string;
  email: string;
  role: TeamMemberRole;
  joinedAt: Timestamp;
}

export interface NewTeamMember {
  name: string;
  email: string;
  role: TeamMemberRole;
}

export interface TeamMemberWithId extends TeamMember {
  id: string;
}
