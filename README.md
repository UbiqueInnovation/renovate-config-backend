# Backend Renovate preset

`base.json5` extends the shared systems preset and the public uetlib coordinate
migration. Internal Maven-parent replacement rules are defined directly here;
public uetlib repositories do not inherit them.

For projects outside uetlib, old, intermediate and public uetlib parents become
`ch.ubique.internal:ubique-library-parent` or
`ch.ubique.internal:ubique-spring-boot-starter-parent`. Original coordinates target
`2026.11.5` / `4.2.0-2026.11.8`. Original, intermediate and public parents always select these internal releases,
independently of the public parent version. Rules match only Maven parent dependencies
and exclude public uetlib and the internal wrapper repositories.

Publish the public `renovate-migration.json5` preset before enabling that preset
reference here. Publish the matching internal parents to Artifactory before merging
the proposed parent replacements.

```sh
pnpm test
pnpm renovate:validate
```
