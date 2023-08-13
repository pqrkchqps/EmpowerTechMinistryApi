const { z } = require("zod");

const Article = z.object({
  id: z.number(),
  userid: z.number(),
  title: z.string(),
  content: z.string(),
  date: z.string(),
  views: z.bigint(),
});

module.exports = Article;
