export default {
  name: "$username",
  callback: async (ctx, event, database, error) => {
    const username =
      event.from?.username ||
      event.message?.from.username ||
      event.user?.username;
    return username;
  },
};
