import {
  checkStripeCheckoutSessionsContract,
  StripeCheckoutSessionsContractError,
  StripeConnectorAccessError,
  StripeContractCheckInconclusiveError,
} from "../lib/diagnostic-conversions";

try {
  const result = await checkStripeCheckoutSessionsContract();
  console.log(
    `Stripe Checkout Sessions contract is valid (${result.sessionsValidated} completed sessions across ${result.pagesValidated} pages validated).`,
  );
} catch (error) {
  if (error instanceof StripeConnectorAccessError) {
    console.error(`CONNECTOR_ACCESS_FAILURE: ${error.message}`);
  } else if (error instanceof StripeCheckoutSessionsContractError) {
    console.error(`RESPONSE_CONTRACT_FAILURE: ${error.message}`);
  } else if (error instanceof StripeContractCheckInconclusiveError) {
    console.error(`INCONCLUSIVE: ${error.message}`);
  } else {
    console.error("UNEXPECTED_FAILURE:", error);
  }
  process.exitCode = 1;
}