import os from "node:os";

export default {
  name: "$availableParallelism",
  callback: async (ctx, event, database, error) => {
    return os.availableParallelism();
  },
};
