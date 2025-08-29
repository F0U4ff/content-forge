import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock Google Gemini API response for development
// Replace with actual Gemini API integration when API key is available
async function mockGeminiSuggestions(description: string, primaryKeyword: string, relevantKeywords: string[]) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const headlines = [
    `${primaryKeyword}: The Ultimate Guide to Getting the Best Deal`,
    `${primaryKeyword}: Avoid These 5 Costly Mistakes Before You Buy`,
    `${primaryKeyword}: Is It Right for Your Budget? Complete Analysis`,
    `${primaryKeyword}: Expert Tips for Finding Hidden Gems`,
    `${primaryKeyword}: Secrets to Negotiating the Perfect Price`
  ];

  const keywordSuggestions = [
    ...relevantKeywords.slice(0, 8),
    `${primaryKeyword} tips`,
    `${primaryKeyword} best practices`,
    `${primaryKeyword} strategy`,
    `${primaryKeyword} guide`,
    `${primaryKeyword} techniques`,
    `${primaryKeyword} trends`,
    `${primaryKeyword} benefits`
  ].slice(0, 15);

  return {
    headlines,
    keywords: keywordSuggestions
  };
}

async function getGeminiSuggestions(description: string, primaryKeyword: string, relevantKeywords: string[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('No Gemini API key found, using mock data');
    return mockGeminiSuggestions(description, primaryKeyword, relevantKeywords);
  }

  try {
    const prompt = `
      CRITICAL: You must respond with ONLY valid JSON, no other text or explanations.

      Based on this content description: "${description}"
      Primary keyword: "${primaryKeyword}"
      Related keywords: ${relevantKeywords.join(', ')}

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
      return mockGeminiSuggestions(description, primaryKeyword, relevantKeywords);
    }

    if (!parsed.headlines || !Array.isArray(parsed.headlines) || 
        !parsed.keywords || !Array.isArray(parsed.keywords)) {
      throw new Error('Invalid JSON structure in response');
    }

    return parsed;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return mockGeminiSuggestions(description, primaryKeyword, relevantKeywords);
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
    const { description, primaryKeyword, relevantKeywords, newKeyword } = body;

    // Validate input
    if (!description || !primaryKeyword || !relevantKeywords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Get initial suggestions
    const suggestions = await getGeminiSuggestions(description, primaryKeyword, relevantKeywords);

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



