import { redirect } from 'next/navigation';

import { DEFAULT_SECTION } from '@/lib/sections';

type TricksIndexProps = {
  params: Promise<{ locale: string }>;
};

export default async function TricksIndex({ params }: TricksIndexProps) {
  const { locale } = await params;
  redirect(`/${locale}/tricks/${DEFAULT_SECTION}`);
}
