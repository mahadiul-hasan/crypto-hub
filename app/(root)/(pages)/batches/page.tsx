import { getPublicBatchesAction } from "@/actions/batch.actions";
import { getMyEnrollmentsAction } from "@/actions/enrollment.actions";
import { BatchesClient } from "@/components/app/batches/batches-client";
import { getCurrentUser } from "@/lib/auth";

export default async function BatchesPage() {
  const batches = await getPublicBatchesAction();
  const user = await getCurrentUser();

  // Get user enrollments if logged in
  let userEnrollments = [];
  if (user) {
    try {
      userEnrollments = await getMyEnrollmentsAction();
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    }
  }

  return (
    <BatchesClient
      initialBatches={batches}
      user={user}
      userEnrollments={userEnrollments}
    />
  );
}
