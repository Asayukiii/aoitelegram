import { AoijsError, AoijsTypeError } from "./AoiError";
import { getObjectKey } from "../utils/";
import type { RequestInit } from "node-fetch";
import { Update } from "@telegram.ts/types";
import { setInterval, clearInterval } from "long-timeout";
import { AoiClient } from "./AoiClient";
import { ContextEvent, EventHandlers } from "./AoiTyping";
import { TelegramBot, Collection, Context } from "telegramsjs";
import { AoiManager, AoiManagerOptions } from "./AoiManager";
import { Interpreter, Complite } from "./core/";
import {
  LibDataFunction,
  DataFunction,
  LibWithDataFunction,
} from "./AoiTyping";
import { version } from "../index";

interface ICommandsSet {
  name: string;
  description?: string;
  reverseReading?: boolean;
  chatId?: number | string;
  useNative?: Function[];
  code: string;
}

class AoiBase extends TelegramBot {
  database: AoiManager = {} as AoiManager;
  commands: Collection<string, ICommandsSet[]> = new Collection();
  availableFunctions: Collection<string, LibWithDataFunction> =
    new Collection();
  availableCollectFunctions = [
    "callbackQuery",
    "editedMessage",
    "myChatMember",
    "shippingQuery",
    "channelPost",
    "inlineQuery",
    "poll",
    "variableCreate",
    "chatBoost",
    "loop",
    "pollAnswer",
    "variableDelete",
    "chatJoinRequest",
    "message",
    "preCheckoutQuery",
    "variableUpdate",
    "chatMember",
    "messageReaction",
    "ready",
    "editedChannelPost",
    "messageReactionCount",
    "removedChatBoost",
  ];

  constructor(
    token: string,
    requestOptions?: RequestInit,
    database?: AoiManagerOptions,
    disableAoiDB?: boolean,
  ) {
    if (!token) {
      throw new AoijsError(
        "AoiBase",
        "You did not specify the 'token' parameter",
      );
    }
    super(token, requestOptions);

    if (!disableAoiDB) {
      this.database = new AoiManager(database);
    }
  }

  on(event: string, listener: (...args: any[]) => void): this;

  on<T extends keyof EventHandlers>(event: T, listener: EventHandlers[T]): this;

  on(event: string, listener: (...data: any[]) => void) {
    super.on(event, listener);
    return this;
  }

  async evaluateCommand(
    command: string | { event: string },
    code: string,
    eventData: unknown,
    useNative?: Function[],
  ) {
    try {
      const complited = new Complite(code, {}, this.availableFunctions);
      const interpreter = new Interpreter(complited.compile(), eventData);
      return await interpreter.runInput();
    } catch (err) {
      console.log(err);
    }
  }

  addFunction(dataFunction: DataFunction | DataFunction[]) {
    if (Array.isArray(dataFunction)) {
      for (const func of dataFunction) {
        const functionName = func?.name?.toLowerCase();
        if (!functionName) {
          throw new AoijsError(
            "customFunction",
            "you did not specify the 'name' parameter",
          );
        }

        if (this.availableFunctions.has(functionName)) {
          throw new AoijsError(
            "customFunction",
            `the function "${functionName}" already exists; to overwrite it, use the <AoiClient>.editFunction method!`,
          );
        }

        if ((func?.version || 0) > version) {
          throw new AoijsError(
            "customFunction",
            `to load this function ${functionName}, the library version must be equal to or greater than ${func?.version || 0}`,
          );
        }

        this.availableFunctions.set(functionName, func);
      }
    } else {
      const functionName = dataFunction?.name?.toLowerCase();
      if (!functionName) {
        throw new AoijsError(
          "customFunction",
          "you did not specify the 'name' parameter",
        );
      }

      if (this.availableFunctions.has(functionName)) {
        throw new AoijsError(
          "customFunction",
          `the function "${functionName}" already exists; to overwrite it, use the <AoiClient>.editFunction method!`,
        );
      }

      if ((dataFunction?.version || 0) > version) {
        throw new AoijsError(
          "customFunction",
          `to load this function ${functionName}, the library version must be equal to or greater than ${dataFunction?.version || 0}`,
        );
      }

      this.availableFunctions.set(functionName, dataFunction);
    }
    return this;
  }

  ensureFunction(dataFunction: DataFunction | DataFunction[]) {
    if (Array.isArray(dataFunction)) {
      for (const func of dataFunction) {
        const functionName = func?.name?.toLowerCase();
        if (!functionName) {
          throw new AoijsError(
            "customFunction",
            "you did not specify the 'name' parameter",
          );
        }

        if ((func?.version || 0) > version) {
          throw new AoijsError(
            "customFunction",
            `to load this function ${functionName}, the library version must be equal to or greater than ${func?.version || 0}`,
          );
        }

        this.availableFunctions.set(functionName, func);
      }
    } else {
      const functionName = dataFunction?.name?.toLowerCase();
      if (!functionName) {
        throw new AoijsError(
          "customFunction",
          "you did not specify the 'name' parameter",
        );
      }

      if ((dataFunction?.version || 0) > version) {
        throw new AoijsError(
          "customFunction",
          `to load this function ${functionName}, the library version must be equal to or greater than ${dataFunction?.version || 0}`,
        );
      }

      this.availableFunctions.set(functionName, dataFunction);
    }
    return this;
  }

  removeFunction(functionName: string | string[]) {
    const functionNames = Array.isArray(functionName)
      ? functionName
      : [functionName];

    if (functionNames.length < 1) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'name' parameter",
      );
    }

    for (const name of functionNames) {
      const lowerCaseName = name.toLowerCase();
      const hasDeleted = this.availableFunctions.delete(lowerCaseName);
      if (!hasDeleted) {
        throw new AoijsError(
          "customFunction",
          `the function "${lowerCaseName}" does not exist or has already been deleted`,
        );
      }
    }
    return true;
  }

  editFunction(dataFunction: DataFunction | DataFunction[]) {
    const functionsToEdit = Array.isArray(dataFunction)
      ? dataFunction
      : [dataFunction];

    if (!functionsToEdit.length) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'name' parameter",
      );
    }

    for (const func of functionsToEdit) {
      const lowerCaseName = func?.name?.toLowerCase();
      if (!this.availableFunctions.has(lowerCaseName)) {
        throw new AoijsError(
          "customFunction",
          `the function "${lowerCaseName}" does not exist; you can only modify functions that have been added recently`,
        );
      }

      this.availableFunctions.set(lowerCaseName, func);
    }

    return true;
  }

  getFunction(functionName: string | string[]) {
    const functionNames = Array.isArray(functionName)
      ? functionName
      : [functionName];

    if (functionNames.length < 1) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'name' parameter",
      );
    }

    if (functionNames.length > 1) {
      return functionNames.map((name) => this.availableFunctions.get(name));
    } else {
      return this.availableFunctions.get(functionNames[0]);
    }
  }

  hasFunction(functionName: string | string[]) {
    if (Array.isArray(functionName)) {
      return functionName.map((fun) => ({
        name: fun,
        result: this.availableFunctions.has(fun),
      }));
    } else if (typeof functionName === "string") {
      return this.availableFunctions.has(functionName);
    } else {
      throw new AoijsError(
        "customFunction",
        `the specified type should be "string | string[]`,
      );
    }
  }

  get countFunction() {
    return this.availableFunctions.size;
  }

  loopCommand(options: {
    every?: number;
    code: string;
    useNative?: Function[];
  }) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }

    let currentIndex = 1;
    const intervalId = setInterval(async () => {
      this.ensureFunction([
        {
          name: "$break",
          callback: () => clearInterval(intervalId),
        },
        {
          name: "$continue",
          callback: (context) => (context.isError = true),
        },
        {
          name: "$index",
          callback: () => currentIndex,
        },
      ]);

      await this.evaluateCommand(
        { event: "loop" },
        options.code,
        this,
        options.useNative,
      );
      currentIndex++;
    }, options.every || 60000);
    return this;
  }

  readyCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("ready", options);
    return this;
  }

  messageCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("message", options);
    return this;
  }

  callbackQueryCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("callbackQuery", options);
    return this;
  }

  messageReactionCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("messageReaction", options);
    return this;
  }

  messageReactionCountCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("messageReactionCount", options);
    return this;
  }

  editedMessageCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("editedMessage", options);
    return this;
  }

  channelPostCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("channelPost", options);
    return this;
  }

  editedChannelPostCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("editedChannelPost", options);
    return this;
  }

  inlineQueryCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("inlineQuery", options);
    return this;
  }

  shippingQueryCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("shippingQuery", options);
    return this;
  }

  preCheckoutQueryCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("preCheckoutQuery", options);
    return this;
  }

  pollCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("poll", options);
    return this;
  }

  pollAnswerCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("pollAnswer", options);
    return this;
  }

  chatMemberCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("chatMember", options);
    return this;
  }

  myChatMemberCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("myChatMember", options);
    return this;
  }

  chatJoinRequestCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("chatJoinRequest", options);
    return this;
  }

  chatBoostCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("chatBoost", options);
    return this;
  }

  removedChatBoostCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.#addCommands("removedChatBoost", options);
    return this;
  }

  variableCreateCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.database.on("create", async (newVariable) => {
      this.ensureFunction({
        name: "$newVariable",
        callback: (context) => {
          const result = getObjectKey(newVariable, context.inside as string);
          return typeof result === "object" ? JSON.stringify(result) : result;
        },
      });
      await this.evaluateCommand(
        { event: "variableCreate" },
        options.code,
        {
          newVariable,
          telegram: this,
        },
        options.useNative,
      );
    });
    return this;
  }

  variableUpdateCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.database.on("update", async (variable) => {
      this.ensureFunction({
        name: "$variable",
        callback: (context) => {
          const result = getObjectKey(variable, context.inside as string);
          return typeof result === "object" ? JSON.stringify(result) : result;
        },
      });
      await this.evaluateCommand(
        { event: "variableUpdate" },
        options.code,
        {
          variable,
          telegram: this,
        },
        options.useNative,
      );
    });
    return this;
  }

  variableDeleteCommand(options: ICommandsSet) {
    if (!options?.code) {
      throw new AoijsError(
        "parameter",
        "you did not specify the 'options.code' parameter",
      );
    }
    this.database.on("delete", async (oldVariable) => {
      this.ensureFunction({
        name: "$oldVariable",
        callback: (context) => {
          const result = getObjectKey(oldVariable, context.inside as string);
          return typeof result === "object" ? JSON.stringify(result) : result;
        },
      });
      await this.evaluateCommand(
        { event: "variableDelete" },
        options.code,
        {
          oldVariable,
          telegram: this,
        },
        options.useNative,
      );
    });
    return this;
  }

  #addCommands(
    type: (typeof AoiBase)["availableCollectFunctions"],
    command: ICommandsSet,
  ) {
    if (!this.availableCollectFunctions.includes(type)) {
      throw new AoijsTypeError(
        `The specified type ${type} does not exist for recording, here are all the available types: ${this.availableCollectFunctions.join(", ")}`,
      );
    }
    if (this.commands.has(type)) {
      const commandsType = this.commands.get(type);
      this.commands.set(type, [...commandsType, command]);
    } else this.commands.set(type, [command]);
  }

  async variables(options: { [key: string]: any }, tables?: string | string[]) {
    if (!("variables" in this.database)) {
      throw new AoijsTypeError(
        'No method named "variables" was found in the database class',
      );
    }
    await this.database.variables(options, tables);
    return;
  }
}

export { AoiBase };
