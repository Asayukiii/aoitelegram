export default {
  name: "$toLowerCase",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(1, error);
    const args = await ctx.getEvaluateArgs();
    ctx.checkArgumentTypes(args, error, ["string"]);
    return args[0].toLowerCase();
  },
};
