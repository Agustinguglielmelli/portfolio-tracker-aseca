const fs = require('fs');
const content = fs.readFileSync(
  'node_modules/@prisma/client/index.d.ts',
  'utf8',
);
const optionsStart = content.indexOf('export type PrismaClientOptions = {');
if (optionsStart > -1) {
  const optionsEnd = content.indexOf('}', optionsStart);
  console.log(content.substring(optionsStart, optionsEnd + 1));
} else {
  console.log('Not found in index.d.ts');
}
