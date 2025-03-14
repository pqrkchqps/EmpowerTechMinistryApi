const { z } = require("zod");

const ArticleSection = z.object({
  id: z.number(),
  articleid: z.number(),
  sequence: z.number(),
  title: z.string(),
});

module.exports = ArticleSection;
