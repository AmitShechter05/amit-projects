import AudiencePage, { audienceMetadata } from '@/components/AudiencePage';

export const metadata = audienceMetadata('men');

export default function Page() {
  return <AudiencePage audience="men" />;
}
