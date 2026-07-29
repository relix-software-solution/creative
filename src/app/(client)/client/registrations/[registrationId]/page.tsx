import { ClientRegistrationDetailsPageContent } from "@/features/client-portal/components/client-registration-details-page-content";

type ClientRegistrationDetailsPageProps = {
  params: Promise<{
    registrationId: string;
  }>;
};

export default async function ClientRegistrationDetailsPage({
  params,
}: ClientRegistrationDetailsPageProps) {
  const { registrationId } = await params;

  return (
    <ClientRegistrationDetailsPageContent registrationId={registrationId} />
  );
}
