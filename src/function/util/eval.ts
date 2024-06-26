import { AoiFunction, ArgsType } from "@structures/AoiFunction";

export default new AoiFunction()
  .setName("$eval")
  .setBrackets(true)
  .setFields({ name: "code", type: [ArgsType.Any], required: true })
  .onCallback(async (context, func) => {
    const result = await context.telegram.evaluateCommand(
      {
        code: await func.resolveCode(context, `${func.inside}`),
      },
      context.eventData,
    );
    if (result?.includes("{FUN=")) {
      context.stopCode = true;
      return func.resolve();
    } else return func.resolve(result);
  });
