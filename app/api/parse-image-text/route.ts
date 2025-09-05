import { NextRequest, NextResponse } from 'next/server';

interface ParsedCreativeData {
  description: string;
  extractedText: string[];
  businessVertical: string;
  productDetails: string;
  marketingHooks: string[];
  suggestedStructure: Array<{
    title: string;
    content: string;
  }>;
  keyThemes: string[];
  targetKeywords: {
    primary: string;
    secondary: string[];
    longTail: string[];
  };
  contentTone: string;
  emotionalTriggers: string[];
  targetAudience: string;
  uniqueSellingPoints: string[];
}

export const dynamic = 'force-dynamic';

// Mock image text extraction for development
async function mockParseImageText(base64Image: string, mimeType: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    description: "Used car dealership offering flexible payment options with inventory from 2014-2024",
    extractedText: [
      "buy car now pay later",
      "2014-2018 see price",
      "2019-2021 see price",
      "2022-2024 see price"
    ],
    businessVertical: "Automotive / Used Car Sales",
    productDetails: "Used vehicles segmented by year ranges with deferred payment options",
    marketingHooks: [
      "Immediate ownership without upfront payment",
      "Wide selection across 10 years of models",
      "Transparent pricing for all budgets"
    ],
    suggestedStructure: [
      {
        title: "Understanding Buy Now Pay Later Car Financing",
        content: "How deferred payment plans work, eligibility, pros and cons"
      },
      {
        title: "Best Value: 2014-2018 Used Cars",
        content: "Affordable older models with proven reliability"
      },
      {
        title: "Nearly New: 2019-2021 Models",
        content: "Low mileage options with modern features"
      },
      {
        title: "Latest Models: 2022-2024 Vehicles",
        content: "Current generation with warranties available"
      }
    ],
    keyThemes: [
      "Flexible financing options",
      "Vehicle depreciation curves",
      "Age-based value propositions"
    ],
    targetKeywords: {
      primary: "buy car now pay later",
      secondary: ["used car financing", "zero down payment", "deferred payment"],
      longTail: ["buy used car no money down bad credit", "2019-2021 cars with payment plans"]
    },
    contentTone: "Helpful and informative while addressing financial concerns",
    emotionalTriggers: ["financial freedom", "immediate gratification", "smart shopping"],
    targetAudience: "Budget-conscious car buyers with limited upfront capital",
    uniqueSellingPoints: ["No down payment required", "Multiple year ranges", "Flexible terms"]
  };
}

function generateDescriptionFromParsedData(data: ParsedCreativeData): string {
  let description = `${data.businessVertical} offering ${data.productDetails}. `;

  if (data.marketingHooks.length > 0) {
    description += `Key value propositions include ${data.marketingHooks.slice(0, 2).join(' and ')}. `;
  }

  if (data.targetAudience) {
    description += `Targeting ${data.targetAudience}. `;
  }

  if (data.keyThemes.length > 0) {
    description += `The content should cover ${data.keyThemes.join(', ')}. `;
  }

  if (data.emotionalTriggers.length > 0) {
    description += `Appeal to ${data.emotionalTriggers.join(' and ')} to engage readers.`;
  }

  return description.trim();
}

async function parseImageTextWithGemini(base64Image: string, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('No Gemini API key found, using mock data');
    return mockParseImageText(base64Image, mimeType);
  }

  try {
    const prompt = `
     Analyze this marketing creative image comprehensively to extract information for SEO article generation. Follow this structured approach:

## STEP 1: TEXT EXTRACTION
Extract ALL visible text including:
- Headlines and subheadlines
- Call-to-action phrases
- Product/service categories
- Price indicators or promotional offers
- Time periods, dates, or ranges
- Warning messages or urgency indicators
- Button text and navigation elements
- Fine print or disclaimers

## STEP 2: VISUAL CONTEXT ANALYSIS
Identify and describe:
- Primary product or service shown (e.g., cars, real estate, electronics)
- Product variations or categories (e.g., different car models, year ranges)
- Visual hierarchy - what draws attention first
- Color psychology and emotional tone
- Target audience indicators

## STEP 3: MARKETING INTENT IDENTIFICATION
Determine:
- Primary value proposition (what problem does this solve?)
- Sales approach (urgency, scarcity, benefit-focused, problem-agitation)
- Customer pain points being addressed
- Unique selling points highlighted
- Pricing strategy or payment options mentioned

## STEP 4: CONTENT SEGMENTATION
If the creative shows multiple segments (like year ranges, product categories):
- List each segment separately
- Identify what differentiates each segment
- Note any progression or hierarchy between segments
- Capture segment-specific benefits or features

## STEP 5: SEO ARTICLE FRAMEWORK
Based on the above analysis, provide:

1. **Primary Topic**: The main subject for the article
2. **Target Audience**: Who would search for this content
3. **Key Sections**: Natural article sections based on the creative's structure
4. **Search Intent Keywords**: What people would search to find this
5. **Emotional Hooks**: Phrases that create urgency or interest
6. **Content Angles**: Different perspectives to cover in the article

## OUTPUT FORMAT:
Structure your response as follows:

**EXTRACTED TEXT:**
[List all text elements found]

**BUSINESS VERTICAL:**
[Identify the industry/niche]

**PRODUCT/SERVICE DETAILS:**
[Specific offerings shown]

**MARKETING HOOKS:**
- [Hook 1]
- [Hook 2]
- [etc.]

**SUGGESTED ARTICLE STRUCTURE:**
- Section 1: [Based on creative segment 1]
- Section 2: [Based on creative segment 2]
- Section 3: [Based on creative segment 3]
- Additional sections as needed

**KEY THEMES TO COVER:**
- [Theme 1]
- [Theme 2]
- [Theme 3]

**TARGET KEYWORDS:**
- Primary: [Main keyword]
- Secondary: [Supporting keywords]
- Long-tail: [Specific search phrases]

**CONTENT TONE:**
[Describe the appropriate tone based on the creative's messaging]

Remember: The goal is to extract enough context to write a comprehensive, SEO-optimized article that matches the creative's intent and covers all aspects shown in the image.

CRITICAL: Return your analysis as valid JSON matching this exact structure:
{
  "extractedText": ["text1", "text2"],
  "businessVertical": "industry/niche",
  "productDetails": "specific offerings",
  "marketingHooks": ["hook1", "hook2"],
  "suggestedStructure": [
    {"title": "Section 1", "content": "description"},
    {"title": "Section 2", "content": "description"}
  ],
  "keyThemes": ["theme1", "theme2"],
  "targetKeywords": {
    "primary": "main keyword",
    "secondary": ["keyword1", "keyword2"],
    "longTail": ["long tail phrase 1", "long tail phrase 2"]
  },
  "contentTone": "tone description",
  "emotionalTriggers": ["trigger1", "trigger2"],
  "targetAudience": "audience description",
  "uniqueSellingPoints": ["usp1", "usp2"]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanations.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0]?.content?.parts[0]?.text || '';

    console.log('Gemini API image analysis response:', responseText);

    try {
      const jsonString = responseText.replace(/^```json\s*|\s*```$/g, '').trim();
      const parsed: ParsedCreativeData = JSON.parse(jsonString);

      const description = generateDescriptionFromParsedData(parsed);

      return {
        ...parsed,
        description
      };
    } catch (parseError) {
      console.error('Failed to parse structured response, falling back to text extraction:', parseError);

      return {
        description: responseText,
        extractedText: [responseText],
        businessVertical: 'Unknown',
        productDetails: '',
        marketingHooks: [],
        suggestedStructure: [],
        keyThemes: [],
        targetKeywords: {
          primary: '',
          secondary: [],
          longTail: []
        },
        contentTone: '',
        emotionalTriggers: [],
        targetAudience: '',
        uniqueSellingPoints: []
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to mock data if API fails
    return mockParseImageText(base64Image, mimeType);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base64Image, mimeType } = body;

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { error: 'Missing base64Image or mimeType' },
        { status: 400 }
      );
    }

    if (!mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    const result = await parseImageTextWithGemini(base64Image, mimeType);

    return NextResponse.json(result);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to parse image text' },
      { status: 500 }
    );
  }
}

