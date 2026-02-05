'use client';

import { GestaoPostsPage } from '@/components/social/GestaoPostsPage';

export default function AdminSocialGestaoPage() {
  return <GestaoPostsPage uploadHref="/admin/social-media/upload" titlePrefix="Admin" />;
}

