export function logSection(title: string) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(title);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

export function logStepStart(stepNo: number, stepName: string) {
  console.log(`\n▶ STEP ${stepNo}: ${stepName.toUpperCase()}`);
  console.log("──────────────────────────────────────");
}

export function logKV(label: string, value: any) {
  console.log(`• ${label}:`);
  console.dir(value, { depth: null, color: true });
}

export function logSuccess(stepName: string, ms: number) {
  console.log(`\n✔ ${stepName.toUpperCase()} COMPLETED (${ms}ms)`);
  console.log("──────────────────────────────────────");
}

export function logError(stepName: string, err: any) {
  console.error(`\n❌ ${stepName.toUpperCase()} FAILED`);
  console.error(err);
  console.log("──────────────────────────────────────");
}
