import type { Metadata } from "next";

import { DeleteAccountPage } from "./delete-form";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "Delete your Miyamoto account and data, from the web or from the app.",
};

export default function Page() {
  return <DeleteAccountPage />;
}
