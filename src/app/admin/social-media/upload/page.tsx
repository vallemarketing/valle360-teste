import UploadPostsCenter from '@/components/social/UploadPostsCenter';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';

export const dynamic = 'force-dynamic';

export default async function AdminSocialMediaUploadPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const access = await resolveSocialUploadAccess({ supabase });
  if (!access.allowed) redirect('/admin');
  return <UploadPostsCenter title="Agendar Postagem (Super Admin)" backHref="/admin/dashboard" />;
}



