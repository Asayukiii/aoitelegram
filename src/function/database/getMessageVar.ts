import { AoiManager } from "@structures/AoiManager";
import { AoiFunction, ArgsType } from "@structures/AoiFunction";

export default new AoiFunction()
  .setName("$getMessageVar")
  .setBrackets(true)
  .setFields({
    name: "variable",
    required: true,
    type: [ArgsType.Any],
  })
  .setFields({
    name: "messageId",
    required: false,
    type: [ArgsType.Number],
    defaultValue: (context) =>
      context.eventData?.message_id || context.eventData?.message?.message_id,
  })
  .setFields({
    name: "chatId",
    required: false,
    type: [ArgsType.Any],
    defaultValue: (context) =>
      context.eventData.chat?.id || context.eventData.message?.chat?.id,
  })
  .setFields({
    name: "table",
    required: false,
    type: [ArgsType.Any],
    defaultValue: async (context) => context.database.tables[0],
  })
  .onCallback(async (context, func) => {
    if (!(context.database instanceof AoiManager)) {
      return func.reject(
        "You can use this function only if the class for the database is a built-in class.",
      );
    }

    const [variable, messageId, chatId, table] =
      await func.resolveFields(context);

    if (!(await context.database.hasTable(table))) {
      return func.reject(`Invalid table "${table}" not found`);
    }

    if (!context.database.collection.has(`${variable}_${table}`)) {
      return func.reject(`Invalid variable "${variable}" not found`);
    }

    return func.resolve(
      await context.database.get(
        table,
        `message_${messageId}_${chatId}_${variable}`,
      ),
    );
  });
