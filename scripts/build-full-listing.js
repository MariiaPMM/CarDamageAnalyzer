const fs = require('fs');
const path = require('path');

const files = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/login.tsx',
  'app/register.tsx',
  'app/modal.tsx',
  'app/analysis-result.tsx',
  'app/history-report/[id].tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/history.tsx',
  'app/(tabs)/explore.tsx',
  'components/external-link.tsx',
  'components/haptic-tab.tsx',
  'components/hello-wave.tsx',
  'components/parallax-scroll-view.tsx',
  'components/themed-text.tsx',
  'components/themed-view.tsx',
  'components/ui/collapsible.tsx',
  'components/ui/icon-symbol.ios.tsx',
  'components/ui/icon-symbol.tsx',
  'constants/theme.ts',
  'context/analysis-flow-context.tsx',
  'context/auth-context.tsx',
  'data/pricing-catalog.ts',
  'data/vehicle-options.ts',
  'hooks/use-color-scheme.ts',
  'hooks/use-color-scheme.web.ts',
  'hooks/use-theme-color.ts',
  'lib/history.ts',
  'lib/openai.ts',
  'lib/pricing.ts',
];

let output = '# Повний лістинг програми\n';

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  output += `\n---\n\n## ${file}\n\n\`\`\`ts\n`;
  output += fs.readFileSync(fullPath, 'utf8');
  if (!output.endsWith('\n')) {
    output += '\n';
  }
  output += '```\n';
}

fs.writeFileSync(path.join(process.cwd(), 'FULL_PROGRAM_LISTING.md'), output, 'utf8');
console.log('FULL_PROGRAM_LISTING.md created');
