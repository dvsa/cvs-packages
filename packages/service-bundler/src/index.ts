import { existsSync, readdirSync } from 'fs';
import { build, BuildOptions } from 'esbuild';
import { esbuildDecorators } from 'esbuild-plugin-typescript-decorators';
import { Dirent } from 'node:fs';
import { join } from 'node:path';
import { archiveFolder } from 'zip-lib';

enum LogColour {
  Cyan = '36',
  Green = '32',
  Yellow = '33'
}

type CustomBuildOptions = {
  /**
   * Whether to create zip files for the build artifacts
   */
  zip?: boolean;
}

type ProxyDetails = {
  name: string;
  version: string;
};

type ServicePackagerOptions = {
  nodeMajorVersion: string;
  proxy?: ProxyDetails;
  esbuildOptions?: BuildOptions;
  artifactOutputDir?: string;
}

export class ServicePackager {
  private readonly proxyDetails: ProxyDetails | undefined;
  private static readonly coreBuildOptions: BuildOptions = {
    bundle: true,
    minify: true,
    sourcemap: process.argv.includes('--source-map'),
    logLevel: 'info',
    platform: 'node',
    external: ['@koa/*', '@babel/*'],
    plugins: [esbuildDecorators()],
  };

  /**
   * Defaults to `artifacts` if not provided
   * @private
   */
  private readonly artifactOutputDir: string;

  /**
   * Configurable options for the service packager
   * @param {ServicePackagerOptions} servicePackagerOptions
   */
  constructor(servicePackagerOptions: ServicePackagerOptions) {
    // Merge the core build options with the provided options (if any).
    // This allows for no config to be passed, but also the ability to override.
    Object.assign(ServicePackager.coreBuildOptions, {
      target: `node${servicePackagerOptions.nodeMajorVersion}`,
      ...(servicePackagerOptions.esbuildOptions || {}),
    });

    this.proxyDetails = servicePackagerOptions.proxy;
    this.artifactOutputDir = servicePackagerOptions.artifactOutputDir || 'artifacts';
  }

  /**
   * Internal logger
   * @param {string} msg
   * @param {LogColour} colour
   */
  private logger = (msg: string, colour: LogColour = LogColour.Cyan) => console.log(`\x1b[${colour}m%s\x1b[0m`, `\n${msg}`);

  /**
   * Build the API proxy using `esbuild`
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
      entryPoints: ['src/proxy/index.ts'],
      outfile: 'dist/src/proxy/index.js',
      ...ServicePackager.coreBuildOptions,
    });

    this.logger('API proxy built complete.', LogColour.Green);
  }

  /**
   * Build the lambda functions using `esbuild`
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
      const entryPoint = join(functionsDir, dir, 'handler.ts');
      const outdir = join(process.cwd(), 'dist', 'functions', dir);

      await build({
        entryPoints: [{ in: entryPoint, out: 'index' }],
        outdir,
        ...ServicePackager.coreBuildOptions,

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

    if (buildOptions?.zip) {
      await this.zip();
    }
  }

  /**
   * Zip the service artifacts
   */
  async zip() {
    this.logger('Zipping service...');

    const functionBundlesDir = join(process.cwd(), 'dist', 'functions');

    let fns: Dirent[] = [];

    try {
      fns = readdirSync(functionBundlesDir, { withFileTypes: true });
    } catch (err) {
      this.logger(`No functions to zip.`, LogColour.Yellow);
    }

    // // timestamp the zip files to make them unique
    const timestamp = Date.now();

    const { name, version } = this.proxyDetails || { name: 'service', version: '1.0.0' };

    for (const fn of fns) {
      this.logger(`Zipping "${fn.name}"...`, LogColour.Yellow);

      const fnArtifactName = process.env.ZIP_NAME
        ? `${process.env.ZIP_NAME}-${fn.name}-${version}-${timestamp}`
        : `${fn.name}-${version}-${timestamp}`;

      await archiveFolder(functionBundlesDir, `${this.artifactOutputDir}/${fnArtifactName}.zip`);
    }

    const proxyBundleDir = join(process.cwd(), 'dist', 'src', 'proxy');

    try {
      readdirSync(proxyBundleDir, { withFileTypes: true });

      this.logger(`Zipping API proxy...`, LogColour.Yellow);

      const proxyArtifactName = process.env.ZIP_NAME
        ? `${process.env.ZIP_NAME}-${name}-${version}-${timestamp}`
        : `${name}-${version}-${timestamp}`;

      await archiveFolder(proxyBundleDir, `${this.artifactOutputDir}/${proxyArtifactName}.zip`);
    } catch {
      this.logger(`No API proxy to zip.`, LogColour.Yellow);
    }

    this.logger(`Packaging complete.`, LogColour.Green);
  }
}

