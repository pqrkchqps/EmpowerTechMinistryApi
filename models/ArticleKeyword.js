const { z } = require("zod");

const ArticleKeyword = z.object({
  id: z.number(),
  articleid: z.number(),
  content: z.string(),
});

module.exports = ArticleKeyword;
