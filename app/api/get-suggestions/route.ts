import { NextRequest, NextResponse } from 'next/server';
import {
  extractYearSegments,
  type SuggestedSection,
} from '@/lib/extractYearSegments';

interface CreativeContext {
  marketingHooks?: string[];
  suggestedStructure?: SuggestedSection[];
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
  const { yearRanges: uniqueYearRanges, productSegments: uniqueSegments } =
    extractYearSegments(creativeContext?.suggestedStructure);
  const urgentHook = creativeContext?.marketingHooks?.find(h => /don't|avoid|never|mistake|warning|urgent/i.test(h));

  if (creativeContext?.marketingHooks && creativeContext.marketingHooks.length > 0) {
    headlines = creativeContext.marketingHooks.slice(0, 5).map(hook => `${primaryKeyword}: ${hook}`);
  } else {
    headlines = [
      `${primaryKeyword}: The Ultimate Guide to Getting the Best Deal`,
      `${primaryKeyword}: Avoid These Costly Mistakes`,
      `${primaryKeyword}: Expert Tips and Strategies`,
      `${primaryKeyword}: Complete Buyer's Guide`,
      `${primaryKeyword}: Everything You Need to Know`
    ];
  }

  if (uniqueYearRanges.length >= 3) {
    for (let i = 0; i < 3 && i < headlines.length; i++) {
      headlines[i] = `${headlines[i]} (${uniqueYearRanges[i]} models)`;
    }
  } else if (uniqueSegments.length >= 3) {
    for (let i = 0; i < 3 && i < headlines.length; i++) {
      headlines[i] = `${headlines[i]} (${uniqueSegments[i]})`;
    }
  }

  if (urgentHook) {
    headlines[headlines.length - 1] = `${primaryKeyword}: ${urgentHook}`;
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
    let yearRanges: string[] = [];
    let productSegments: string[] = [];
    let urgentHook: string | undefined;

    if (creativeContext) {
      const extracted = extractYearSegments(creativeContext.suggestedStructure);
      yearRanges = extracted.yearRanges;
      productSegments = extracted.productSegments;
      urgentHook = creativeContext.marketingHooks?.find(h => /don't|avoid|never|mistake|warning|urgent/i.test(h));
    }

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

    const additionalInstructions: string[] = [
      'If the creative shows 3 year ranges, at least 3 headlines must mention those specific years. If the creative has urgent warnings, reflect that tone.',
      "Make the headlines specific to what's actually in the creative, not generic."
    ];
    if (yearRanges.length) {
      additionalInstructions.push(`Year ranges detected: ${yearRanges.join(', ')}`);
    }
    if (productSegments.length) {
      additionalInstructions.push(`Product segments detected: ${productSegments.join(', ')}`);
    }
    if (urgentHook) {
      additionalInstructions.push(`Include at least one urgent headline using tone like: \"${urgentHook}\"`);
    }
    const additionalRequirements = additionalInstructions.map(r => `      - ${r}`).join('\n');

    const headlineFormula = creativeContext?.suggestedStructure ? `
HEADLINE FORMULA:
Each headline MUST incorporate:
1. Primary keyword (within first 5 words)
2. Creative's core message: ${creativeContext.marketingHooks?.[0] || 'key benefit'}
3. Scope indicator: ${creativeContext.suggestedStructure.length > 1 ?
   `(covers ${creativeContext.suggestedStructure.map(s => s.title.match(/\d{4}|\w+/)?.[0]).filter(Boolean).join(', ')})` :
   'comprehensive guide'}

Examples based on this creative:
- "${primaryKeyword}: ${creativeContext.marketingHooks?.[0]} (${creativeContext.suggestedStructure.map(s => s.title).join(' vs ')})"
- "${primaryKeyword} ${creativeContext.emotionalTriggers?.[0]}: ${creativeContext.suggestedStructure.length} Essential Sections"
` : '';

    const prompt = `
      CRITICAL: You must respond with ONLY valid JSON, no other text or explanations.

      Based on this content description: "${description}"
      Primary keyword: "${primaryKeyword}"
      Related keywords: ${relevantKeywords.join(', ')}
      ${contextSection}
      ${headlineFormula}

      Generate 5 short, punchy, creative-specific headlines that:
      1. ALL must start with exactly: "${primaryKeyword}:"
      2. Follow the headline formula above
      3. Directly reflect the content and themes from the creative
      4. Match the emotional tone and marketing approach identified
      5. Address the target audience's specific needs
      6. Incorporate the unique selling points when relevant
${additionalRequirements}

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
      - Keep each headline concise and punchy (maximum 12 words)
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

export async function refineHeadlinesWithNewKeyword(headlines: string[], newKeyword: string) {
  // This function will refine existing headlines based on a new keyword
  return headlines.map((headline) => {
    const trimmedHeadline = headline.trim();

    // Only split when a colon exists in the headline
    if (!trimmedHeadline.includes(':')) {
      // If the headline already contains the new keyword, leave it unchanged
      return trimmedHeadline.toLowerCase().includes(newKeyword.toLowerCase())
        ? trimmedHeadline
        : `${newKeyword}: ${trimmedHeadline}`;
    }

    const [, ...rest] = trimmedHeadline.split(':');
    const refinedText = rest.join(':').trim();
    return `${newKeyword}: ${refinedText}`;
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
