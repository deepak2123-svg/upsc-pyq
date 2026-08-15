import { UPSCPuraanApp } from "../../../upscpuraan-app";

export const metadata = { title: "Test results", robots: { index: false, follow: false } };

export default async function TestResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UPSCPuraanApp initialScreen="results" initialTestId={id} />;
}
