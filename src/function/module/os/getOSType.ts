import os from "node:os";

export default {
  name: "$getOSType",
  callback: async (ctx, event, database, error) => {
    return os.type();
  },
};