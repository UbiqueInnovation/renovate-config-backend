import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseJson } from '../node_modules/renovate/dist/util/common.js';
import { applyPackageRules } from '../node_modules/renovate/dist/util/package-rules/index.js';
import { determineNewReplacementName, determineNewReplacementValue } from '../node_modules/renovate/dist/workers/repository/process/lookup/utils.js';

const config = parseJson(readFileSync(new URL('../base.json5', import.meta.url), 'utf8'), 'base.json5');
const rules = config.packageRules.filter(rule => rule.replacementName?.startsWith('ch.ubique.internal:'));
assert.equal(rules.length, 4);
assert.ok(!config.extends.some(preset => preset.includes('renovate-internal-migration')));

async function replacement(repository, packageName, currentValue, depType = 'parent') {
  const config = await applyPackageRules({packageRules: rules, repository, packageName,
    depName: packageName, currentValue, depType, manager: 'maven', datasource: 'maven', versioning: 'maven'});
  return config.replacementName ? `${determineNewReplacementName(config)}:${determineNewReplacementValue(config)}` : null;
}
let checks = 0;
for (const [artifact, target, version] of [
  ['uetlib-parent', 'ubique-library-parent', '2026.11.5'],
  ['uetlib-spring-boot-starter-parent', 'ubique-spring-boot-starter-parent', '4.2.0-2026.11.8'],
]) {
  for (const group of ['ch.ubique', 'ch.ubique.uetlib', 'ch.uetlib']) {
    for (const depType of ['parent', 'parent-root']) {
      assert.equal(await replacement('UbiqueInnovation/example-backend', `${group}:${artifact}`, version, depType), `ch.ubique.internal:${target}:${version}`);
      checks++;
    }
    for (const depType of ['compile', 'import', 'test']) {
      assert.equal(await replacement('UbiqueInnovation/example-backend', `${group}:${artifact}`, version, depType), null);
      checks++;
    }
    for (const repo of ['uetlib', 'uetlib-core', 'uetlib-testapp', 'ubique-library-parent', 'ubique-spring-boot-starter-parent']) {
      assert.equal(await replacement(`UbiqueInnovation/${repo}`, `${group}:${artifact}`, version), null);
      checks++;
    }
  }
}
assert.equal(await replacement('UbiqueInnovation/example-backend', 'ch.ubique.internal:ubique-library-parent', '2026.11.0'), null);
assert.equal(await replacement('UbiqueInnovation/example-backend', 'org.springframework.boot:spring-boot-starter-parent', '4.1.1'), null);
console.log(`Passed ${checks + 2} internal-parent replacement cases.`);

for (const group of ['ch.ubique', 'ch.ubique.uetlib', 'ch.uetlib']) {
  assert.equal(await replacement('UbiqueInnovation/example-backend', `${group}:uetlib-spring-boot-starter-parent`, '4.1.2-2026.11.6'), 'ch.ubique.internal:ubique-spring-boot-starter-parent:4.2.0-2026.11.8');
}
console.log('Passed 3 public-to-internal starter version cases.');

for (const group of ['ch.ubique', 'ch.ubique.uetlib', 'ch.uetlib']) {
  assert.equal(await replacement('UbiqueInnovation/example-backend', `${group}:uetlib-parent`, '2026.11.1'), 'ch.ubique.internal:ubique-library-parent:2026.11.5');
}
console.log('Passed 3 public-to-internal library version cases.');
