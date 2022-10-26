import { BuildStrategy } from "../BuildStrategy";
import { displayPath, runCommand } from "../../system";
import { logActivity } from "../../logging";
import { intlMsg } from "../../intl";
import { BuildManifestConfig } from "../../project";

export class LocalBuildStrategy extends BuildStrategy<void> {
  getStrategyName(): string {
    return "local";
  }

  public async buildSources(): Promise<void> {
    const run = async () => {
      const bindLanguage = await this.project.getManifestLanguage();
      const buildManifest = await this.project.getBuildManifest();
      const buildManifestConfig = buildManifest.config as BuildManifestConfig;

      if (buildManifestConfig.polywrap_module) {
        const polywrapModuleDir = buildManifestConfig.polywrap_module.dir;
        let scriptPath = `${__dirname}/../../defaults/build-strategies/${bindLanguage}/${this.getStrategyName()}/local.sh`;

        if (bindLanguage.startsWith("wasm")) {
          const customScript = buildManifest.strategies?.local?.scriptPath;
          scriptPath = customScript ?? scriptPath;
        }

        await logActivity(
          this.project.logger,
          intlMsg.lib_helpers_buildText(),
          intlMsg.lib_helpers_buildError(),
          intlMsg.lib_helpers_buildWarning(),
          async (logger) => {
            return await runCommand(
              "chmod",
              ["+x", scriptPath],
              logger,
              undefined,
              process.cwd()
            ).then(() =>
              runCommand(
                scriptPath,
                [polywrapModuleDir, this.outputDir],
                logger
              )
            );
          }
        );
      }
    };

    const args = {
      path: displayPath(this.outputDir),
    };
    return await logActivity<void>(
      this.project.logger,
      intlMsg.lib_helpers_copyText(args),
      intlMsg.lib_helpers_copyError(args),
      intlMsg.lib_helpers_copyWarning(args),
      async () => {
        return await run();
      }
    );
  }
}
