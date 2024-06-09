import fs from "node:fs";
import path from "node:path";
import figlet from "figlet";
import { AoijsTypeError } from "./AoiError";
import type { AoiClient } from "./AoiClient";

class LoadCommands {
  private path?: string;
  public readonly telegram: AoiClient;

  constructor(telegram: AoiClient) {
    telegram.loadCommands = this;
    this.telegram = telegram;
  }

  loadCommands(dirPath: string, logger: boolean = true) {
    if (!dirPath) {
      throw new AoijsTypeError("You did not specify the 'dirPath' parameter");
    }

    dirPath = path.join(process.cwd(), dirPath);
    if (!fs.existsSync(dirPath)) {
      throw new AoijsTypeError(
        `The specified file path was not found: ${dirPath}`,
      );
    }

    if (logger) {
      const bigText = figlet.textSync("AoiTelegram");
      console.log(bigText);
    }

    const items = fs.readdirSync(dirPath, { recursive: true });

    for (const itemPath of items) {
      if (typeof itemPath !== "string" || !itemPath.endsWith(".js")) continue;

      const itemData = require(path.join(dirPath, itemPath));
      if (itemData) {
        this.#registerCommand(itemData, path.join(dirPath, itemPath), logger);
      }
    }
  }

  loadVariables(dirPath: string, logger: boolean = true) {
    if (!dirPath) {
      throw new AoijsTypeError("You did not specify the 'dirPath' parameter");
    }

    dirPath = path.join(process.cwd(), dirPath);
    if (!fs.existsSync(dirPath)) {
      throw new AoijsTypeError(
        `The specified file path was not found: ${dirPath}`,
      );
    }

    if (logger) {
      const bigText = figlet.textSync("Variables");
      console.log(bigText);
    }

    const items = fs.readdirSync(dirPath, { recursive: true });

    for (const item of items) {
      if (typeof item !== "string" || !item.endsWith(".js")) continue;

      const itemPath = path.join(dirPath, item);
      const itemData = require(itemPath);

      if (itemData) {
        const requireFun = itemData.default || itemData;

        const isArrayOrEmptyObject =
          (!Array.isArray(requireFun) && typeof requireFun !== "object") ||
          requireFun?.length === 0 ||
          Object.keys(requireFun)?.length === 0;

        if (isArrayOrEmptyObject) {
          throw new AoijsTypeError(
            "To store variables from the loader, specify an array or an object of parameters",
            { path: itemPath },
          );
        }

        const requireArray = Array.isArray(requireFun)
          ? requireFun
          : [requireFun];

        for (const { variables, tables } of requireArray) {
          this.telegram.variables(variables, tables);
        }

        console.log(
          `|---------------------------------------------------------------------|\n`,
          `| Loading in ${itemPath} | Loaded | variables |`,
        );
      }
    }
  }

  #registerCommand(
    itemData: Record<string, any>,
    itemPath: string,
    logger: boolean,
  ): void {
    const requireFun = itemData.default || itemData;
    const requireArray = Array.isArray(requireFun) ? requireFun : [requireFun];

    for (const data of requireArray) {
      if ("name" in data) {
        this.telegram.addCommand(data);
        console.log(
          `|---------------------------------------------------------------------|\n`,
          `| Loading in ${itemPath} | Loaded ${data.name} | command |`,
        );
      }

      if ("data" in data) {
        this.telegram.addAction(data);
        console.log(
          `|---------------------------------------------------------------------|\n`,
          `| Loading in ${itemPath} | Loaded ${data.data} | action |`,
        );
      }

      if ("id" in data) {
        this.telegram.timeoutCommand(data);
        console.log(
          `|---------------------------------------------------------------------|\n`,
          `| Loading in ${itemPath} | Loaded ${data.id} | timeout |`,
        );
      }

      if ("awaited" in data) {
        this.telegram.loopCommand(data);
        console.log(
          `|---------------------------------------------------------------------|\n`,
          `| Loading in ${itemPath} | Loaded ${data.awaited} | awaited |`,
        );
      }

      if ("type" in data) {
        switch (data.type) {
          case "ready":
            this.telegram.readyCommand(data);
            break;
          case "message":
            this.telegram.messageCommand(data);
            break;
          case "channel_post":
            this.telegram.channelPostCommand(data);
            break;
          case "callback_query":
            this.telegram.callbackQueryCommand(data);
            break;
          case "edited_message":
            this.telegram.editedMessageCommand(data);
            break;
          case "message_reaction":
            this.telegram.messageReactionCommand(data);
            break;
          case "message_reaction_count":
            this.telegram.messageReactionCountCommand(data);
            break;
          case "edited_channel_post":
            this.telegram.editedChannelPostCommand(data);
            break;
          case "inline_query":
            this.telegram.inlineQueryCommand(data);
            break;
          case "shipping_query":
            this.telegram.shippingQueryCommand(data);
            break;
          case "pre_checkout_query":
            this.telegram.preCheckoutQueryCommand(data);
            break;
          case "poll":
            this.telegram.pollCommand(data);
            break;
          case "poll_answer":
            this.telegram.pollAnswerCommand(data);
            break;
          case "chat_member":
            this.telegram.chatMemberCommand(data);
            break;
          case "my_chat_member":
            this.telegram.myChatMemberCommand(data);
            break;
          case "chat_join_request":
            this.telegram.chatJoinRequestCommand(data);
            break;
          case "chat_boost":
            this.telegram.chatBoostCommand(data);
            break;
          case "removed_chat_boost":
            this.telegram.removedChatBoostCommand(data);
            break;
          case "business_connection":
            this.telegram.businessConnectionCommand(data);
            break;
          case "business_message":
            this.telegram.businessMessageCommand(data);
            break;
          case "edited_business_message":
            this.telegram.editedBusinessMessageCommand(data);
            break;
          case "deleted_business_messages":
            this.telegram.deletedBusinessMessagesCommand(data);
            break;
          case "loop":
            this.telegram.loopCommand(data);
            break;
          case "variableCreate":
            this.telegram.variableCreateCommand(data);
            break;
          case "variableUpdate":
            this.telegram.variableUpdateCommand(data);
            break;
          case "variableDelete":
            this.telegram.variableDeleteCommand(data);
            break;
          case "functionError":
            this.telegram.functionErrorCommand(data);
            break;
          default:
            throw new AoijsTypeError(`Event '${data.type}' is not defined`);
        }

        console.log(
          `|---------------------------------------------------------------------|\n`,
          `| Loading in ${itemPath} | Loaded | events |`,
        );
      }
    }
  }
}

export { LoadCommands };
