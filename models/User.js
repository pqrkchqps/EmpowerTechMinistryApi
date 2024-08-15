const { z } = require("zod");

const User = z.object({
  id: z.number(),
  email: z.string(),
  password: z.string(),
  username: z.string(),
  type: z.string(),
  image: z.string(),
  name: z.string(),
  date: z.string(),
  description: z.string(),
});

module.exports = User;