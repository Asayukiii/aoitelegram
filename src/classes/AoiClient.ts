import chalk from "chalk";
import path from "node:path";
import fs from "node:fs/promises";
import { AoiBase } from "./AoiBase";
import { AoiLogger } from "./AoiLogger";
import { CustomEvent } from "./CustomEvent";
import { AoiFunction } from "./AoiFunction";
import type { RequestInit } from "node-fetch";
import { AoiExtension } from "./AoiExtension";
import type { ILoginOptions } from "telegramsjs";
import aoiStart from "./handlers/custom/AoiStart";
import type { LoadCommands } from "./LoadCommands";
import { Collection } from "@telegram.ts/collection";
import { AoijsError, AoijsTypeError } from "./AoiError";
import { TimeoutManager } from "../helpers/TimeoutManager";
import { AwaitedManager } from "../helpers/AwaitedManager";
import type { DataFunction, CommandData } from "./AoiTyping";
import { AoiManager, type AoiManagerOptions } from "./AoiManager";
import { AoiWarning, type AoiWarningOptions } from "./AoiWarning";

class AoiClient extends AoiBase {
  public customEvent?: CustomEvent;
  public warningManager: AoiWarning;
  public loadCommands?: LoadCommands;
  public timeoutManager: TimeoutManager;
  public awaitedManager: AwaitedManager;
  public functionError?: boolean = false;
  public sendMessageError?: boolean = true;
  public readonly commands: Collection<
    string,
    (
      | CommandData<{ data: string }>
      | CommandData<{ name: string; aliases?: string[] }>
    )[]
  > = new Collection();
  public readonly globalVars: Collection<string, unknown> = new Collection();

  constructor(
    token: string,
    public readonly parameters: {
      requestOptions?: RequestInit;
      database?: AoiManagerOptions;
      disableFunctions?: string[];
      extensions?: AoiExtension[];
      functionError?: boolean;
      sendMessageError?: boolean;
      disableAoiDB?: boolean;
      logging?: boolean;
      autoUpdate?: AoiWarningOptions;
    } = {},
  ) {
    super(
      token,
      parameters.requestOptions,
      parameters.database,
      parameters.disableAoiDB,
    );

    const allAoiExtends = parameters.extensions?.every?.(
      (cls) => cls instanceof AoiExtension,
    );

    if (!allAoiExtends && Array.isArray(parameters.extensions)) {
      throw new AoijsTypeError(
        "In the parameter 'extensions', all classes should be inherited from the class 'AoiExtension'",
      );
    }

    this.functionError = parameters.functionError;
    this.sendMessageError =
      typeof parameters.sendMessageError === "undefined"
        ? true
        : parameters.sendMessageError;
    this.timeoutManager = new TimeoutManager(this);
    this.awaitedManager = new AwaitedManager(this);
    this.warningManager = new AoiWarning(parameters.autoUpdate || {});
  }

  addCommand(
    options: CommandData<{
      name: string;
      aliases?: string[];
    }>,
  ): AoiClient {
    if (!options?.name) {
      throw new AoijsError("You did not specify the 'name' parameter");
    }
    if (!options?.code) {
      throw new AoijsError("You did not specify the 'code' parameter");
    }
    if (this.commands.has("command")) {
      const commandsType = this.commands.get("command");
      this.commands.set("command", [...(commandsType || []), options]);
    } else this.commands.set("command", [options]);
    return this;
  }

  addAction(options: CommandData<{ data: string }>): AoiClient {
    if (!options?.data) {
      throw new AoijsError("You did not specify the 'data' parameter");
    }
    if (!options?.code) {
      throw new AoijsError("You did not specify the 'code' parameter");
    }
    if (this.commands.has("action")) {
      const actionType = this.commands.get("action");
      this.commands.set("action", [...(actionType || []), options]);
    } else this.commands.set("action", [options]);
    return this;
  }

  timeoutCommand(options: CommandData<{ id: string }>): AoiClient {
    if (!options?.id) {
      throw new AoijsError("You did not specify the 'id' parameter");
    }
    if (!options?.code) {
      throw new AoijsError("You did not specify the 'code' parameter");
    }
    this.timeoutManager.registerTimeout(options);
    return this;
  }

  awaitedCommand(options: CommandData<{ name: string }>): AoiClient {
    if (!options?.name) {
      throw new AoijsError("You did not specify the 'name' parameter");
    }
    if (!options?.code) {
      throw new AoijsError("You did not specify the 'code' parameter");
    }
    this.awaitedManager.registerAwaited(options);
    return this;
  }

  async connect(options?: ILoginOptions): Promise<void> {
    const { autoUpdate = {}, extensions = [], logging } = this.parameters;

    if (autoUpdate.aoiWarning) {
      await this.warningManager.checkUpdates();
    }
    this.awaitedManager.handleAwaited();

    if ("connect" in this.database) {
      await this.database.connect().then(async () => {
        if (this.database instanceof AoiManager) {
          for (const [tables, variables] of this.availableVariables) {
            await this.database.variables?.(variables, tables);
          }
        }
      });
    }

    if (extensions.length > 0) {
      for (let i = 0; i < extensions.length; i++) {
        const initPlugins = extensions[i];
        try {
          await initPlugins["initPlugins"](this);
          AoiLogger.info(
            `Plugin '${initPlugins.name}' has been dreadfully registered`,
          );
        } catch (err) {
          AoiLogger.error(err);
        }
      }
    }

    this.on("ready", async (ctx) => {
      await this.#loadFunctions();
      aoiStart(this);
    });
    super.login();
  }

  async #loadFunctions(): Promise<void> {
    const dirPath = path.join(__dirname, "../function/");
    const items = await fs.readdir(dirPath, {
      recursive: true,
    });

    for (const itemPath of items) {
      if (!itemPath.endsWith(".js")) continue;
      if (this.parameters.disableAoiDB && itemPath.includes("database"))
        continue;
      const { default: dataFunction } = require(`${dirPath}/${itemPath}`);

      if (
        !dataFunction ||
        (dataFunction && !(dataFunction instanceof AoiFunction))
      ) {
        continue;
      }

      const dataFunctionName = dataFunction.name.toLowerCase();
      if (this.parameters.disableFunctions?.indexOf(dataFunctionName) === -1) {
        continue;
      }

      this.availableFunctions.set(dataFunctionName, dataFunction);
    }
  }
}

export { AoiClient };
