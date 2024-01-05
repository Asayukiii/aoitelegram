import { isValidChat } from "../helpers";

export default {
  name: "$addCustomReaction",
  callback: async (context) => {
    context.argsCheck(1);
    const [
      custom_emoji,
      is_big = true,
      message_id = context.event.message_id ||
        context.event.message?.message_id,
      chatId = context.event.chat?.id || context.event.message?.chat.id,
    ] = context.splits;
    context.checkArgumentTypes([
      "string",
      "boolean | undefined",
      "number | undefined",
      "number | string | undefined",
    ]);

    if (context.isError) return;

    if (!(await isValidChat(context.event, chatId))) {
      context.sendError("Invalid Chat Id");
      return;
    }

    const result = await context.telegram
      .setMessageReaction({
        chat_id: chatId,
        message_id,
        reaction: [{ type: "custom_emoji", custom_emoji }],
      })
      .catch(() => null);

    if (!result) {
      context.sendError("Invalid customEmoji/messageId");
      return;
    }

    return true;
  },
};
