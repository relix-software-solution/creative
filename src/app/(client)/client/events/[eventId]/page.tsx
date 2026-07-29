import { ClientEventDetailsPageContent } from "@/features/client-portal/components/client-event-details-page-content";

type ClientEventDetailsPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function ClientEventDetailsPage({
  params,
}: ClientEventDetailsPageProps) {
  const { eventId } = await params;

  return <ClientEventDetailsPageContent eventId={eventId} />;
}
