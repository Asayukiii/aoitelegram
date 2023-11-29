export default {
  name: "$replyMessage",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(1, error, "$replyMessage");
    const args = await ctx.getEvaluateArgs();
    return await event.reply(args[0]);
  },
};
