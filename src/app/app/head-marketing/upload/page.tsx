import UploadPostsCenter from '@/components/social/UploadPostsCenter';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';

export const dynamic = 'force-dynamic';

export default async function AppHeadMarketingUploadPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const access = await resolveSocialUploadAccess({ supabase });
  if (!access.allowed) redirect('/app/dashboard');
  return <UploadPostsCenter title="Agendar Postagem (Valle Marketing • Head Marketing)" backHref="/app/head-marketing" />;
}



