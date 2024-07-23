# aws-utils

Helper library for simplifying and standardising usage of AWS clients

### Pre-requisites

- Node.js (Please see `.nvmrc` for specific version)
- `npm` (If using [n](https://github.com/tj/n) or [nvm](https://github.com/nvm-sh/nvm), this will be automatically managed)
- Security
  - [Git secrets](https://github.com/awslabs/git-secrets)
  - [ScanRepo](https://github.com/UKHomeOffice/repo-security-scanner)
    - Unzip `repo-security-scanner_<version>_Darwin_<architercture>.tar.gz` and rename the executable inside the folder
      to `scanrepo` - Add executable to path (using `echo $PATH` to find your path)

### Getting started

###### Run the following command after cloning the project

1. `npm install` (or `npm i`)

###### The code that will be published lives inside the ./src directory.

If wishing to add new top level directories to the output, then they must be included in the `files` array inside `package.json` as well as included in the `clean:temp` command.

### Publishing

In order to see the output of what will be published, run the following command:

```shell
npm publish --dry-run
```

There are two ways in which this package can/should be published:

###### Requires manual version bump via the PR

- Upon merge into `main` branch, the package will be published via a GHA workflow.

### Using a package

This suite of packages is intended to obfuscate logic in regards to offline running utilising `@aws-sdk/credentials-provider`. 
This allows the consumer to authetnicate locally making use of the `~/.aws/credentials` details on the machine, this is achieved via using `fromIni()` and passing in as the `credentials` option.

In order to tell the client wrapper to use the local secrets, you must set the `USE_CREDENTIALS` value to `true` inside the `.env` file.

e.g. `.env`
```
HOST=host
DB_NAME=my-database

USE_CREDENTIALS=true
```

In a `.ts` file, you can then use a client like

```
import { DynamoDb } from '@dvsa/aws-utilities/classes/dynamo-db-client';

export class DataProvider {
  async get() {
    const client = DynamoDb.getClient({ region: 'eu-west-1' });

    const result = await client.send( // some command goes here );

    // or whatever you need to do
  }
```

By omitting `USE_CREDENTIALS` or it being set to `false`, the real resource will attempted to be interacted with. Therefore on AWS lambda, this should never be `true`!
