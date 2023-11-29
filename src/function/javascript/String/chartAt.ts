export default {
  name: "$chartAt",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(2, error, "$chartAt");
    const args = await ctx.getEvaluateArgs();
    return args[0].charAt(args[1] - 1);
  },
};
