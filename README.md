# CVS Packages

A mono-repository for Commercial Vehicle Services (**CVS**) packages.

The components can be found in the `packages/*` directory.

### Adding new packages
When adding a new package, the best approach is to create a new directory under `packages/*` & run `npm init -y`

This will create a basic `package.json` file which can be updated with the relevant information.

### Deploying new packages

There is a [publish.yaml](./.github/workflows/publish.yaml) GitHub action integrated into the repo, that can be used to publish new packages to the NPM registry.

You need to add a new step into the `Orchestrator` to listen out for changed files in the desired package.

You can then replicate the pattern of publishing like so

```bash
  publish-[PKG]:
    needs: orchestrator
    runs-on: ubuntu-latest
    if: ${{ needs.orchestrator.outputs.publish-[PKG] || github.event_name == 'workflow_dispatch' && inputs.package == [PKG]}}
    steps:
      - name: Publish Package
        uses: ./.github/actions/publish-package
        with:
          package-path: 'packages/[PKG]'
        env:
          NPM_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}
```
