import type { Metadata } from "next";

import { SupportPage } from "./support-form";

export const metadata: Metadata = {
  title: "Support",
  description: "Something wrong? Tell us plainly. One person reads every message.",
};

export default function Page() {
  return <SupportPage />;
}
