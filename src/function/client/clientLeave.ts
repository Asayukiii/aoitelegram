export default {
  name: "$clientLeave",
  callback: async (context) => {
    const [chatId = context.event.chat?.id || context.event.message?.chat.id] =
      context.splits;
    context.checkArgumentTypes(["string | number | undefined"]);
    if (context.isError) return;

    const result = await context.telegram.leaveChat(chatId).catch(() => null);

    if (!result) {
      context.sendError("Invalid Chat Id");
      return;
    }

    return result;
  },
};
