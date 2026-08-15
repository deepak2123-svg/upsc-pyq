import { UPSCPuraanApp } from "../../../upscpuraan-app";

export const metadata = { title: "Attempt test", robots: { index: false, follow: false } };

export default async function TestAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UPSCPuraanApp initialScreen="attempt" initialTestId={id} />;
}
