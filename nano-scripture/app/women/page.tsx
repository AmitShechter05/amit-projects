import AudiencePage, { audienceMetadata } from '@/components/AudiencePage';

export const metadata = audienceMetadata('women');

export default function Page() {
  return <AudiencePage audience="women" />;
}
