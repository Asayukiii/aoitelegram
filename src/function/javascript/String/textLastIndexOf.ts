export default {
  name: "$textLastIndexOf",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(2, error);
    const args = await ctx.getEvaluateArgs();
    ctx.checkArgumentTypes(args, error, ["string"]);
    return args[0].lastIndexOf(args[1]);
  },
};
