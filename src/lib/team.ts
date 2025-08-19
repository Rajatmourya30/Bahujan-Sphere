import { collection, getDocs, type Timestamp } from 'firebase/firestore';
import { db } from './firebase';

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

export async function getTeamMembers(): Promise<TeamMemberWithId[]> {
  const teamCollection = collection(db, 'teamMembers');
  const snapshot = await getDocs(teamCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TeamMemberWithId[];
}
