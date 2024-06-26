import type { AoiClient } from "../AoiClient";

function onInlineQuery(telegram: AoiClient): void {
  telegram.on("inline_query", async (ctx) => {
    const events = telegram.events.get("inlineQuery");
    if (!events) return;

    for (const event of events) {
      await telegram.evaluateCommand(event, ctx);
    }
  });
}

export default onInlineQuery;
