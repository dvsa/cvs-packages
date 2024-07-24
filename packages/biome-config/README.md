# biome-config

Share biome configuration between services.

### Pre-requisites

- Node.js (Please see `.nvmrc` in the root of the repo for a specific version)
- `npm` (If using [n](https://github.com/tj/n) or [nvm](https://github.com/nvm-sh/nvm), this will be automatically managed)
- Security
  - [Git secrets](https://github.com/awslabs/git-secrets)
  - [ScanRepo](https://github.com/UKHomeOffice/repo-security-scanner)
    - Unzip `repo-security-scanner_<version>_Darwin_<architercture>.tar.gz` and rename the executable inside the folder
      to `scanrepo` - Add executable to path (using `echo $PATH` to find your path)
---

### Getting started

###### Run the following command after cloning the project

1. `npm install` (or `npm i`)

---
### Publishing

###### The code that will be published lives inside the ./src directory.

In order to see the output of what will be published, run the following command:

```shell
npm publish --dry-run
```

There are two ways in which this package can/should be published:

SHOULD:
###### Requires manual version bump via the PR

- Upon merge into `main` branch, the package will be published via a GHA workflow.

CAN:
###### Requires manual version bump via the PR

- If you are an authenticated member of the DVSA `npm` account, you can manually publish changes, although this is discouraged.
---

### Using the package

[Info](https://biomejs.dev/guides/configure-biome/#share-a-configuration-file) can be found here on the Biome docs.
