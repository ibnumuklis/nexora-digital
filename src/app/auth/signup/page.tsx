import type { Metadata } from 'next';
import { SignUpForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Create staff account' };

export default function SignUpPage() {
  return <SignUpForm />;
}
