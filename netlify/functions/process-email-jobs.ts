import { processEmailJobs } from "../../lib/email-worker";

export const handler = async () => {
  const result = await processEmailJobs(10);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
