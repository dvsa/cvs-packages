import { copy } from 'fs-extra';
import { type BuildConfig, build } from 'bun';
import { createWriteStream, type Dirent, existsSync, readdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import archiver from 'archiver';

enum LogColour {
  Cyan = '36',
  Green = '32',
  Yellow = '33',
  LightRed = '91',
}

type CustomBuildOptions = {
  /**
   * Only TS is compiled, therefore if non-TS files are needed at runtime e.g. XML / YAML, they must be copied into the bundle.
   * e.g. [{ from: 'src/domain/mappers', to: 'dist/mappers' }].
   */
  copyFiles?: CopyFilesOptions[];
  /**
   * Whether to create zip files for the build artifacts
   */
  zip?: boolean;
};

type ProxyDetails = {
  /**
   * The name of the service. This will be the prefix for the produced the zip file name.
   * Defaults to `service`
   */
  name: string;
  /**
   * The version of the service. This will included as part of the zip file name.
   * Defaults to `1.0.0`
   */
  version: string;
};

type CopyFilesOptions = {
  from: string;
  to: string;
};

type Config = {
  /**
   * The directory to output the build artifacts to
   * Defaults to `/artifacts`
   */
  artifactOutputDir: string;
  /**
   * The directory to output the build artifacts to
   * Defaults to `/dist`
   */
  buildOutputDir: string;
};

type ServicePackagerOptions = {
  /**
   * Optional proxy details to be used in artifact creation.
   */
  proxy?: ProxyDetails;
  /**
   * Optional build options to override the core build options.
   */
  buildOptions?: BuildConfig;
  /**
   * Optional configuration options.
   */
  config?: Config;
  /**
   * Optional handler file name for the function. The file extension IS required.
   * e.g. `index.ts` / `handler.ts` / `main.ts`
   */
  handlerFileName?: string;
};

export class ServicePackager {
  private static handlerFileName: string;
  private static proxyDetails: ProxyDetails;
  private static config: Config;
  private static readonly coreBuildOptions: Partial<BuildConfig> = {
    minify: true,
    sourcemap: process.argv.includes('--source-map') ? 'inline' : 'none',
    target: 'node',
    external: ['@koa/*', '@babel/*'],
  };

  /**
   * Configurable options for the service packager
   * @param {ServicePackagerOptions} servicePackagerOptions
   */
  constructor(servicePackagerOptions: ServicePackagerOptions) {
    // Merge the core build options with the provided options (if any).
    // This allows for no config to be passed, but also the ability to override.
    Object.assign(ServicePackager.coreBuildOptions, {
      ...(servicePackagerOptions.buildOptions || {}),
    });

    // Set the static properties using defaults or provided options
    ServicePackager.proxyDetails = servicePackagerOptions.proxy || {
      name: 'service',
      version: '1.0.0',
    };

    ServicePackager.config = servicePackagerOptions.config || {
      artifactOutputDir: 'artifacts',
      buildOutputDir: 'dist',
    };

    ServicePackager.handlerFileName = servicePackagerOptions.handlerFileName || 'handler.ts';
  }

  /**
   * Internal logger
   * @param {string} msg
   * @param {LogColour} colour
   */
  private logger = (msg: string, colour: LogColour = LogColour.Cyan) =>
    console.log(`\x1b[${colour}m%s\x1b[0m`, `\n${msg}`);

  /**
   * Copy any non-transpiled i.e. non TS files into the build output
   * @param {CopyFilesOptions} opts
   * @param {Config} config
   * @private
   */
  private async copyNonTranspiledFiles(opts: CopyFilesOptions, config: Config) {
    try {
      const inputPath = join(process.cwd(), opts.from);

      const outputPath = `${config.buildOutputDir}/${opts.to}`;

      this.logger(`Copying contents from "${inputPath}" to "${outputPath}"`);

      await copy(inputPath, outputPath, { overwrite: true });

      this.logger('Contents copied successfully.', LogColour.Green);
    } catch (error) {
      this.logger(`Contents failed to copy. Error: ${error}.`, LogColour.LightRed);
      process.exit(1);
    }
  }

  /**
   * Build the API proxy
   * @private
   */
  private async buildAPIProxy() {
    this.logger('Starting API proxy build.');

    const proxyDir = join(process.cwd(), 'src', 'proxy');

    // Check if the proxy directory exists
    if (!existsSync(proxyDir)) {
      this.logger("No 'src/proxy' directory found. Skipping proxy build.", LogColour.Yellow);
      return;
    }

    await build({
      entrypoints: ['src/proxy/index.ts'],
      outdir: `${ServicePackager.config.buildOutputDir}/src/proxy`,
      ...ServicePackager.coreBuildOptions,
    });

    this.logger('API proxy built complete.', LogColour.Green);
  }

  /**
   * Build the lambda functions
   * @private
   */
  private async buildFunctions() {
    this.logger('Starting functions build(s).');

    const functionsDir = join(process.cwd(), 'src', 'functions');

    // Check if the functions directory exists
    if (!existsSync(functionsDir)) {
      this.logger("No 'src/functions' directory found. Skipping function build.", LogColour.Yellow);
      return;
    }

    const directories = readdirSync(functionsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Bundle each folder within functions
    for (const dir of directories) {
      const entryPoint = join(functionsDir, dir, ServicePackager.handlerFileName);
      const outdir = join(process.cwd(), ServicePackager.config.buildOutputDir, 'functions', dir);

      await build({
        ...ServicePackager.coreBuildOptions,
        entrypoints: [entryPoint],
        outdir,
        // exclude the packages needed for the API proxying
        external: ['cors', 'express', 'routing-controllers', 'serverless-http'],
      });
    }

    this.logger('Function build(s) completed.', LogColour.Green);
  }

  /**
   * Build the service
   * @param {CustomBuildOptions} buildOptions
   */
  public async build(buildOptions?: CustomBuildOptions) {
    this.logger('Building service...');

    await this.buildAPIProxy();

    await this.buildFunctions();

    if (buildOptions?.copyFiles) {
      this.logger('Copying files...');

      for await (const opts of buildOptions.copyFiles) {
        await this.copyNonTranspiledFiles(opts, ServicePackager.config);
      }
    }

    if (buildOptions?.zip) {
      await this.zip();
    }
  }

  /**
   * Zip the service artifacts
   */
  async zip() {
    this.logger('Zipping service...');

    const functionBundlesDir = join(
      process.cwd(),
      ServicePackager.config.buildOutputDir,
      'functions'
    );

    let fns: Dirent[] = [];

    try {
      fns = readdirSync(functionBundlesDir, { withFileTypes: true });
    } catch {
      this.logger(`No functions to zip.`, LogColour.Yellow);
    }

    // timestamp the zip files to make them unique
    const timestamp = Date.now();

    const { name, version } = ServicePackager.proxyDetails;

    for (const fn of fns) {
      this.logger(`Zipping "${fn.name}"...`, LogColour.Yellow);

      const fnArtifactName = process.env.ZIP_NAME
        ? `${process.env.ZIP_NAME}-${fn.name}-${version}-${timestamp}`
        : `${fn.name}-${version}-${timestamp}`;

      const zipFile = `${ServicePackager.config.artifactOutputDir}/${fnArtifactName}.zip`;

      await this.archiveFolder(`${functionBundlesDir}/${fn.name}`, zipFile);

      const { size } = await stat(zipFile);

      this.logger(`"${fn.name}" zipped successfully. ~ Size: ${this.bytesToSize(size)}.`, LogColour.Green);
    }

    const proxyBundleDir = join(
      process.cwd(),
      ServicePackager.config.buildOutputDir,
      'src',
      'proxy'
    );

    try {
      readdirSync(proxyBundleDir, { withFileTypes: true });

      this.logger(`Zipping API proxy...`, LogColour.Yellow);

      const proxyArtifactName = process.env.ZIP_NAME
        ? `${process.env.ZIP_NAME}-${name}-${version}-${timestamp}`
        : `${name}-${version}-${timestamp}`;

      const zipFile = `${ServicePackager.config.artifactOutputDir}/${proxyArtifactName}.zip`;

      await this.archiveFolder(proxyBundleDir, zipFile);

      const { size } = await stat(zipFile);

      this.logger(`API proxy zipped successfully. ~ Size: ${this.bytesToSize(size)}.`, LogColour.Green);
    } catch {
      this.logger(`No API proxy to zip.`, LogColour.Yellow);
    }

    this.logger(`Packaging complete.`, LogColour.Green);
  }

  private async archiveFolder(sourceDir: string, outPath: string) {
    const output = createWriteStream(outPath);

    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  /**
   * Calculate the size of an artifact, in the most appropriate unit
   * @param {number} bytes - number of bytes
   * @private
   */
  private bytesToSize(bytes: number): string {
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) {
      return 'n/a';
    }

    const i: number = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());

    if (i === 0) {
      return `${bytes} ${sizes[i]}`;
    }

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}
