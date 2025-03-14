const { z } = require("zod");

const SectionParagraph = z.object({
  id: z.number(),
  articlesectionid: z.number(),
  sequence: z.number(),
  content: z.string(),
});

module.exports = SectionParagraph;
