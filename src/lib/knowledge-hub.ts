
import type { TranslationKey } from './i18n/translations';
import type { Timestamp } from 'firebase/firestore';

export interface KnowledgeOrganization {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  logoUrl: string;
  imageAiHint: string;
  websiteUrl: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submittedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

// This static data is no longer used by the live app but is kept for reference.
export const allKnowledgeOrganizations: KnowledgeOrganization[] = [
  {
    id: 'org-1',
    nameKey: 'org_1_name',
    descriptionKey: 'org_1_desc',
    logoUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'organization logo',
    websiteUrl: 'https://en.wikipedia.org/wiki/Scheduled_Castes_Federation',
  },
  {
    id: 'org-2',
    nameKey: 'org_2_name',
    descriptionKey: 'org_2_desc',
    logoUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'student organization logo',
    websiteUrl: 'https://en.wikipedia.org/wiki/Bahujan_Vidyarthi_Sangh',
  },
  {
    id: 'org-3',
    nameKey: 'org_3_name',
    descriptionKey: 'org_3_desc',
    logoUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'social organization logo',
    websiteUrl: 'https://en.wikipedia.org/wiki/Samata_Sainik_Dal',
  },
];
