import type { Metadata } from "next";
import { UPSCPuraanApp } from "./upscpuraan-app";

export const metadata: Metadata = {
  title: "UPSC Test Series & PYQ Practice | UPSCPuraan",
  description:
    "Build focused UPSC CSE, CAPF, CDS and NDA tests from verified PYQs and reviewed MCQs.",
};

export default function Home() {
  return <UPSCPuraanApp />;
}
