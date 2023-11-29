export default {
  name: "$split",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(2, error, "$split");
    const args = await ctx.getEvaluateArgs();
    return args[0].split(args[1]);
  },
};
