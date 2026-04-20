
User wants to:
1. Stop using OpenAI/DeepSeek for recipe generation
2. Use Lovable AI (built-in) or Perplexity only
3. Make the AI provider selectable/configurable

Edge functions currently using external AI:
- `generate-recipe` - main recipe generation
- `generate-daily-meal` - daily meal generation
- `analyze-leftovers` - leftover analysis (uses OpenAI Vision)
- `generate-recipe-image` - image generation

Approach: Add a UI selector in user settings + pass `aiProvider` parameter to edge functions. Default to Lovable AI (free, no key needed). Perplexity requires connector.

Keep this concise.
