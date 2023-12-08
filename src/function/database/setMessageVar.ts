export default {
  name: "$setMessageVar",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(2, error);
    const args = await ctx.getEvaluateArgs();
    const messageId = event.message_id || event.message?.message_id;
    const chatId = event.chat?.id || event.message?.chat.id;
    const defaultTable = args[3] || database.table[0];
    ctx.checkArgumentTypes(args, error, [
      "string",
      "unknown",
      "string | number | undefined",
      "string | undefined",
    ]);

    if (!(await database.has(defaultTable, args[0]))) {
      error.errorVar(args[0], "$setMessageVar");
      return;
    }

    await database.set(
      defaultTable,
      `message_${args[2] || messageId}_${chatId}_${args[0]}`,
      args[1],
    );
  },
};