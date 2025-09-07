import { NextRequest, NextResponse } from 'next/server';

interface CreativeContext {
  marketingHooks?: string[];
  suggestedStructure?: Array<{ title: string; content: string }>;
  emotionalTriggers?: string[];
  targetAudience?: string;
  uniqueSellingPoints?: string[];
  businessVertical?: string;
  keyThemes?: string[];
}

export const dynamic = 'force-dynamic';

// Mock Google Gemini API response for development
// Replace with actual Gemini API integration when API key is available
async function mockGeminiSuggestionsWithContext(
  description: string,
  primaryKeyword: string,
  relevantKeywords: string[],
  creativeContext?: CreativeContext
) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  let headlines = [];

  if (creativeContext?.marketingHooks && creativeContext.marketingHooks.length > 0) {
    headlines = creativeContext.marketingHooks.slice(0, 5).map(hook =>
      `${primaryKeyword}: ${hook}`
    );
  } else {
    headlines = [
      `${primaryKeyword}: The Ultimate Guide to Getting the Best Deal`,
      `${primaryKeyword}: Avoid These Costly Mistakes`,
      `${primaryKeyword}: Expert Tips and Strategies`,
      `${primaryKeyword}: Complete Buyer's Guide`,
      `${primaryKeyword}: Everything You Need to Know`
    ];
  }

  let keywords = [...relevantKeywords.slice(0, 8)];

  if (creativeContext?.suggestedStructure) {
    creativeContext.suggestedStructure.forEach(section => {
      const sectionKeywords = section.title.toLowerCase().split(' ')
        .filter(word => word.length > 3 && !['with', 'from', 'that', 'this'].includes(word));
      keywords.push(...sectionKeywords);
    });
  }

  if (creativeContext?.keyThemes) {
    keywords.push(...creativeContext.keyThemes);
  }

  keywords = Array.from(new Set(keywords)).slice(0, 15);

  return {
    headlines,
    keywords
  };
}

async function getGeminiSuggestionsWithContext(
  description: string,
  primaryKeyword: string,
  relevantKeywords: string[],
  creativeContext?: CreativeContext
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('No Gemini API key found, using mock data');
    return mockGeminiSuggestionsWithContext(description, primaryKeyword, relevantKeywords, creativeContext);
  }

  try {
    // Before building the prompt, add this context section:
    let contextSection = '';
    if (creativeContext) {
      contextSection = `
    CREATIVE CONTEXT FROM IMAGE ANALYSIS:
    - Marketing Hooks: ${creativeContext.marketingHooks?.join(', ') || 'None identified'}
    - Business Type: ${creativeContext.businessVertical || 'General'}
    - Target Audience: ${creativeContext.targetAudience || 'General audience'}
    - Emotional Triggers: ${creativeContext.emotionalTriggers?.join(', ') || 'None identified'}
    - Unique Selling Points: ${creativeContext.uniqueSellingPoints?.join(', ') || 'None identified'}
    - Key Themes: ${creativeContext.keyThemes?.join(', ') || 'None identified'}

    SUGGESTED ARTICLE SECTIONS FROM CREATIVE:
    ${creativeContext.suggestedStructure?.map(s => `- ${s.title}: ${s.content}`).join('\n') || 'No specific structure identified'}
    `;
    }

    const prompt = `
      CRITICAL: You must respond with ONLY valid JSON, no other text or explanations.

      Based on this content description: "${description}"
      Primary keyword: "${primaryKeyword}"
      Related keywords: ${relevantKeywords.join(', ')}
      ${contextSection}

      Generate 5 highly relevant, creative-specific headlines that:
      1. ALL must start with exactly: "${primaryKeyword}:"
      2. Directly reflect the content and themes from the creative
      3. Match the emotional tone and marketing approach identified
      4. Address the target audience's specific needs
      5. Incorporate the unique selling points when relevant

      ${creativeContext?.marketingHooks ? `
      IMPORTANT: Base headlines on these specific marketing hooks from the creative:
      ${creativeContext.marketingHooks.map((hook, i) => `${i + 1}. ${hook}`).join('\n')}
      ` : ''}

      ${creativeContext?.suggestedStructure ? `
      IMPORTANT: Consider these content sections identified in the creative:
      ${creativeContext.suggestedStructure.map(s => s.title).join(', ')}
      ` : ''}

      Search the web for current trends and insights, then provide:
      1. Five compelling article headlines - CRITICAL: ALL headlines MUST start with the exact primary keyword "${primaryKeyword}"
         - One benefit-focused headline
         - One problem-solving headline
         - One curiosity-driven headline
         - One comparison/guide headline
         - One expert tips/secrets headline
      2. 10-15 SEO keyword suggestions related to the topic

      HEADLINE REQUIREMENTS:
      - Every headline MUST begin with exactly: "${primaryKeyword}"
      - Follow with a colon (:) then the rest of the headline
      - Make them compelling and click-worthy
      - Ensure variety in approach and angle

      Respond with ONLY this JSON structure (no markdown, no explanations, just pure JSON):
      {
        "headlines": [
          "${primaryKeyword}: headline1 based on ${description}",
          "${primaryKeyword}: headline2 inspired by ${description}",
          "${primaryKeyword}: headline3 related to ${description}",
          "${primaryKeyword}: headline4 reflecting ${description}",
          "${primaryKeyword}: headline5 focusing on ${description}"
        ],
        "keywords": [
          "keyword1 from ${description}",
          "keyword2 inspired by ${description}",
          "keyword3 based on ${description}",
          "keyword4 reflecting ${description}",
          "keyword5 related to ${description}",
          "keyword6 focusing on ${description}",
          "keyword7 mentioned in ${description}",
          "keyword8 connected to ${description}",
          "keyword9 described in ${description}",
          "keyword10 according to ${description}"
        ]
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    // Log the raw response to help with debugging
    const responseBody = await response.json();
    console.log('Gemini API Response:', responseBody);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Extract content from the response (this part handles the Markdown)
    const text = responseBody.candidates[0]?.content?.parts[0]?.text;

    if (!text) {
      throw new Error('No content generated');
    }

    // Remove the markdown code block markers and parse the JSON
    const jsonString = text.replace(/^```json\s*|\s*```$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return mockGeminiSuggestionsWithContext(description, primaryKeyword, relevantKeywords, creativeContext);
    }

    if (!parsed.headlines || !Array.isArray(parsed.headlines) || 
        !parsed.keywords || !Array.isArray(parsed.keywords)) {
      throw new Error('Invalid JSON structure in response');
    }

    return parsed;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return mockGeminiSuggestionsWithContext(description, primaryKeyword, relevantKeywords, creativeContext);
  }
}

async function refineHeadlinesWithNewKeyword(headlines: string[], newKeyword: string) {
  // This function will refine existing headlines based on a new keyword
  return headlines.map((headline) => {
    return `${newKeyword}: ${headline.split(":")[1].trim()}`;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, primaryKeyword, relevantKeywords, newKeyword, creativeContext } = body;

    // Validate input
    if (!description || !primaryKeyword || !relevantKeywords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Get initial suggestions
    const suggestions = await getGeminiSuggestionsWithContext(
      description,
      primaryKeyword,
      relevantKeywords,
      creativeContext
    );

    // Step 2: Refine headlines with new keyword if provided
    let refinedHeadlines = suggestions.headlines;

    if (newKeyword) {
      refinedHeadlines = await refineHeadlinesWithNewKeyword(suggestions.headlines, newKeyword);
    }

    // Return refined suggestions
    return NextResponse.json({
      headlines: refinedHeadlines,
      keywords: suggestions.keywords
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}



