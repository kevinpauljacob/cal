export async function delay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`Waiting ${ms / 1000} seconds before next request...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
