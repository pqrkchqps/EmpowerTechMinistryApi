const { z } = require("zod");

const Comment = z.object({
  id: z.number(),
  userid: z.number(),
  rootid: z.number(),
  parentid: z.number(),
  content: z.string(),
  type: z.string(),
  date: z.string(),
});

module.exports = Comment;
