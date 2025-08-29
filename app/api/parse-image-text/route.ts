import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock image text extraction for development
async function mockParseImageText(base64Image: string, mimeType: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    extractedText: "Professional marketing campaign for premium automotive services featuring luxury vehicle maintenance and repair solutions. High-quality service center specializing in European car brands with certified technicians and state-of-the-art diagnostic equipment."
  };
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
    const extractedText = data.candidates[0]?.content?.parts[0]?.text;
    
    console.log('Gemini API image analysis response:', extractedText);
    
    if (!extractedText) {
      throw new Error('No text extracted from image');
    }

    return {
      extractedText: extractedText.trim()
    };

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