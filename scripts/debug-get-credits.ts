import { GET as getCreditsRoute } from '@/app/api/packages/credits/route';

async function main() {
  const res: any = await getCreditsRoute({} as any);
  const body = await res.json();
  // Print compact output
  console.log(JSON.stringify(body, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

