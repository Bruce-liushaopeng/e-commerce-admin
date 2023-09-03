import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  // if no user logedin, we redirect to sign-in page
  if (!userId) {
    redirect("/sign-in");
  }

  // show the user the first store they have in their DB
  const store = await prismadb.store.findFirst({
    where: {
      userId,
    },
  });

  // redirect the user to their first store
  if (store) {
    redirect(`/${store.id}`);
  }

  return <>{children}</>;

  // or direct them to home page to create their first store
}
