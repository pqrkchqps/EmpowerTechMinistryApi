const { z } = require("zod");

const SectionParagraph = z.object({
  id: z.number(),
  articlesectionid: z.number(),
  content: z.string(),
});

module.exports = SectionParagraph;
