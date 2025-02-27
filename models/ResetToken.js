const { z } = require("zod");

const ResetToken = z.object({
  id: z.number(),
  userid: z.number(),
  token: z.string(),
  date: z.string(),
});

module.exports = ResetToken;