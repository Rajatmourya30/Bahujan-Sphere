
import { NextResponse } from 'next/server';
import { allKnowledgeOrganizations } from '@/lib/knowledge-hub';

export async function GET() {
  return NextResponse.json(allKnowledgeOrganizations);
}
