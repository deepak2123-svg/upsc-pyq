import { UPSCPuraanApp } from "../../upscpuraan-app";

export const metadata = { title: "Build a test", robots: { index: false, follow: false } };

export default function BuildPage() {
  return <UPSCPuraanApp initialScreen="builder" />;
}
