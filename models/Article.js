const { z } = require("zod");

const Article = z.object({
  id: z.number(),
  userid: z.number(),
  date: z.string(),
  views: z.bigint(),
  title: z.string(),
  image: z.string(),
  type: z.string(),
});

module.exports = Article;
