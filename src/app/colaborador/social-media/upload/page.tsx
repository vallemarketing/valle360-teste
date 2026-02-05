import UploadPostsCenter from '@/components/social/UploadPostsCenter';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';

export const dynamic = 'force-dynamic';

export default async function SocialMediaUploadPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const access = await resolveSocialUploadAccess({ supabase });
  if (!access.allowed) redirect('/colaborador/dashboard');
  return <UploadPostsCenter title="Agendar Postagem (Social Media)" backHref="/colaborador/social-media" />;
}



