# ShakiLabs UI artifact

`shakilabs-ui-0.3.11.tgz` is the active exact artifact for `@shakilabs/ui` 0.3.11.

- Source repository: `00.root-shakilabs`
- Source commit: `657cf80b72ef4a977b7b34e765b8ddb4ce9fbef7`
- SHA-256: `2c9587d9fd74af697f0a95bc50e39bccf169fb48dcebf37afe5991926b713b54`
- Referenced from: `client/package.json` → `"@shakilabs/ui": "file:vendor/shakilabs-ui-0.3.11.tgz"`
- Rollback artifacts: available from Git history when needed

Only the active exact artifact is committed so an isolated Vercel checkout can run `npm ci` without a private registry token.

## Verifying integrity

```sh
shasum -a 256 client/vendor/shakilabs-ui-0.3.11.tgz
```

The output must equal the SHA-256 above. CI enforces this on every run via
`client/scripts/verify-vendor-readme.mjs` ("Verify vendored artifacts" step), which cross-checks
three sources against each other: the tgz filename version, the version and hash recorded here,
and the `file:vendor/...` reference in `client/package.json`.

## Updating to a new version

1. Build and pack the new artifact in `00.root-shakilabs`.
2. Replace the tgz in this directory (only one tgz is kept — delete the previous one).
3. Update the `file:vendor/...` reference in `client/package.json`, then run `npm install`
   so `package-lock.json` records the new integrity hash.
4. Update **all four** facts in this file: version in the heading line, source commit, SHA-256,
   and the `file:vendor/...` reference line.
5. Shared UI copy changes require `npm run fonts:subset` before `npm run build` — this app has a
   font-subset gate. `client/scripts/font-subset-config.mjs` scans
   `node_modules/@shakilabs/ui/dist/index.js` as a content root, so Korean copy added to the shared
   package (footer service list, nav labels) renders as tofu unless the subset is regenerated.
