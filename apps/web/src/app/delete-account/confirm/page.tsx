import type { Metadata } from "next";
import { Suspense } from "react";

import { ConfirmDeletion } from "./confirm-form";

export const metadata: Metadata = {
  title: "Confirm deletion",
  description: "Confirm and complete the deletion of your Miyamoto account.",
  // A one-time destructive link has no business in an index.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <ConfirmDeletion />
    </Suspense>
  );
}
