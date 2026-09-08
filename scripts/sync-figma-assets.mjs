import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const assets = {
  'public/assets/branding/seguridad-sspc.png': 'https://www.figma.com/api/mcp/asset/272900db-4397-41b9-a358-4f2706e5c325.png',
  'public/assets/icons/logout.svg': 'https://www.figma.com/api/mcp/asset/89e295d5-49e2-494d-a119-57e74c7f2410.svg',
  'public/assets/icons/dashboard.svg': 'https://www.figma.com/api/mcp/asset/ae4cb732-af8c-4730-8dcf-f5eaabb7d0b8.svg',
  'public/assets/icons/consolidation.svg': 'https://www.figma.com/api/mcp/asset/926a0fc1-8fe4-4cc8-81b4-93e353a7b04b.svg',
  'public/assets/icons/registro.svg': 'https://www.figma.com/api/mcp/asset/eb65350d-19ae-457b-9cab-e6fa1f8771f2.svg',
  'public/assets/icons/search.svg': 'https://www.figma.com/api/mcp/asset/4b5b1180-c384-4113-81bf-7adbd2db31ee.svg',
  'public/assets/icons/administration.svg': 'https://www.figma.com/api/mcp/asset/b11dad9a-6fac-40fc-865e-d862e5528ec7.svg',
  'public/assets/icons/instructions.svg': 'https://www.figma.com/api/mcp/asset/77d8612c-aa00-4bfc-ae8f-1dfb1865c7e1.svg',
  'public/assets/icons/progress.svg': 'https://www.figma.com/api/mcp/asset/eadfd62d-bf7c-4eb3-b33e-462642b1f073.svg',
  'public/assets/icons/recommendation.svg': 'https://www.figma.com/api/mcp/asset/8bef16c9-8772-4197-bb2f-e563642eb3a2.svg',
  'public/assets/icons/previous.svg': 'https://www.figma.com/api/mcp/asset/abec7726-2e66-4857-90af-9061e95af778.svg',
  'public/assets/icons/origin.svg': 'https://www.figma.com/api/mcp/asset/fc6069de-e609-463e-9f11-4ebcfc6012ab.svg',
  'public/assets/icons/calendar.svg': 'https://www.figma.com/api/mcp/asset/aa53d37f-6b8c-4e48-9d16-37494800abf3.svg',
  'public/assets/icons/save.svg': 'https://www.figma.com/api/mcp/asset/80cae29f-bcf5-4ad1-9b33-a4b3a7a3007e.svg',
  'public/assets/icons/next.svg': 'https://www.figma.com/api/mcp/asset/ac214318-2f72-4faa-b25e-a617ee6ea686.svg',
  'public/assets/icons/section.svg': 'https://www.figma.com/api/mcp/asset/4718688f-3173-41b7-97af-c30c4f3c7b1a.svg',
  'public/assets/icons/collapse.svg': 'https://www.figma.com/api/mcp/asset/8101381c-adff-496d-a3b1-9a179b96593f.svg',
  'public/assets/icons/identification.svg': 'https://www.figma.com/api/mcp/asset/ce07b6ab-64e5-4288-90ac-ba36a56f3bc3.svg',
  'public/assets/icons/contact.svg': 'https://www.figma.com/api/mcp/asset/68f62c17-0b1f-4823-a453-88c658d20382.svg',
  'public/assets/icons/camera.svg': 'https://www.figma.com/api/mcp/asset/ad80ce76-3c09-4793-ade8-843ce5557622.svg',
  'public/assets/icons/user-round.svg': 'https://www.figma.com/api/mcp/asset/86b8bc16-b6f8-412e-b268-ada818cbf247.svg',
  'public/assets/icons/status-dot.svg': 'https://www.figma.com/api/mcp/asset/f2192786-454f-46cd-8cf0-ab65a50f5528.svg'
};

if (process.env.SKIP_FIGMA_ASSET_SYNC === '1') {
  console.log('Figma asset sync skipped by SKIP_FIGMA_ASSET_SYNC=1.');
  process.exit(0);
}

let downloaded = 0;
for (const [relativePath, url] of Object.entries(assets)) {
  const target = resolve(relativePath);
  try {
    const info = await stat(target);
    if (info.size > 20) continue;
  } catch { /* file does not exist yet */ }

  await mkdir(dirname(target), { recursive: true });
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Figma asset ${relativePath}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(target, bytes);
  downloaded++;
  console.log(`✓ ${relativePath}`);
}
console.log(downloaded ? `Downloaded ${downloaded} Figma assets into public/assets.` : 'Figma assets already present.');
