# cvs-microservice-common

Common code used by the various serverless microservices within the Commercial Vehicle Services (CVS) system, published as a GitHub package.

## Pre-requisites

- Node.js (Please see `.nvmrc` for specific version)
- `npm` (If using [n](https://github.com/tj/n) or [nvm](https://github.com/nvm-sh/nvm), this will be automatically managed)
- Security
  - [Git secrets](https://github.com/awslabs/git-secrets)
  - [ScanRepo](https://github.com/UKHomeOffice/repo-security-scanner)
    - Unzip `repo-security-scanner_<version>_Darwin_<architercture>.tar.gz` and rename the executable inside the folder
      to `scanrepo` - Add executable to path (using `echo $PATH` to find your path)

## Getting started

### Using Lerna

Lerna is a monorepo management tool that enables root level commands to act on packages within a packages directory.

You can run any npm command across all the packages by prefixing it with `npx lerna run` e.g. `npx lerna run build` or `npx lerna run test`.

Package versions can be managed at the root level of a lerna repo so, while they belong in the same repository, they are managed and published as independent npm packages.

### Run the following command after cloning the project

1. `npx lerna run install`

### The code that will be published lives inside the ./packages/src directories

If wishing to add new top level directories to a packages output, they must be included in the `files` array inside `package.json` as well as included in the `clean:temp` command.

## Publishing

In order to see the output of what will be published, run the following command:

```shell
npx lerna publish
```

There are two ways in which this package can/should be published:

### Requires manual version bump via the PR

- Upon merge into `main` branch, the package will be published via a GHA workflow.

### Version bump available via the GUI

- A `workflow_dispatch` can be executed which will commit, push & publish the version bump and latest code.
