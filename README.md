# CVS Packages

A mono-repository for Commercial Vehicle Services (**CVS**) packages.

The components can be found in the `packages/*` directory.

### Adding new packages
When adding a new package, the best approach is to create a new directory under `packages/*` & run `npm init -y`

This will create a basic `package.json` file which can be updated with the relevant information.

### Deploying new packages

There is a [publish.yaml](./.github/workflows/publish.yaml) GitHub action integrated into the repo, that can be used to publish new packages to the NPM registry.

To deploy a new package, simply add your package name to the `options` list at the top which should mirror the folder name.
