function hasObject(arg: any): arg is object {
  try {
    return !!JSON.parse(arg);
  } catch (err) {
    return false;
  }
}

export default {
  name: "$setTimeout",
  callback: async (ctx, event, database, error) => {
    ctx.argsCheck(2, error, "$setTimeout");
    const args = await ctx.getEvaluateArgs();
    if (args[2]) {
      if (!hasObject(args[2])) {
        error.customError("Error object", "$setTimeout");
      }
    }
    await event.telegram?.timeoutManager.addTimeout(args[0], {
      milliseconds: args[1],
      data: args[2],
    });
  },
};