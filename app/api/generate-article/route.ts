import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Calculate article metrics
function calculateArticleMetrics(content: string, primaryKeyword: string, selectedKeywords: string[]) {
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Calculate reading time (average 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);
  
  // Calculate keyword density
  const allKeywords = [primaryKeyword, ...selectedKeywords].join(' ').toLowerCase();
  const keywordWords = allKeywords.split(/\s+/);
  const contentLower = content.toLowerCase();
  
  let keywordCount = 0;
  keywordWords.forEach(keyword => {
    const matches = contentLower.match(new RegExp(`\\b${keyword}\\b`, 'g'));
    keywordCount += matches ? matches.length : 0;
  });
  
  const keywordDensity = Math.round((keywordCount / wordCount) * 100 * 100) / 100;
  
  // Calculate SEO score (simplified algorithm)
  let seoScore = 0;
  
  // Word count (800 words target)
  if (wordCount >= 750 && wordCount <= 850) seoScore += 25;
  else if (wordCount >= 600 && wordCount <= 1000) seoScore += 15;
  else seoScore += 5;
  
  // Keyword density (0.5-1.5% target)
  if (keywordDensity >= 0.5 && keywordDensity <= 1.5) seoScore += 25;
  else if (keywordDensity >= 0.3 && keywordDensity <= 2.0) seoScore += 15;
  else seoScore += 5;
  
  // Structure (headings)
  const h1Count = (content.match(/^# /gm) || []).length;
  const h2Count = (content.match(/^## /gm) || []).length;
  if (h1Count === 1 && h2Count >= 3) seoScore += 25;
  else if (h1Count === 1 && h2Count >= 2) seoScore += 15;
  else seoScore += 5;
  
  // Bold keywords
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  if (boldCount >= 3 && boldCount <= 8) seoScore += 25;
  else if (boldCount >= 1) seoScore += 15;
  else seoScore += 5;
  
  return {
    wordCount,
    readingTime,
    keywordDensity,
    seoScore
  };
}

function validateKeywordDensity(content: string, primaryKeyword: string): boolean {
  const primaryCount = (content.match(new RegExp(primaryKeyword, 'gi')) || []).length;
  return primaryCount >= 4 && primaryCount <= 6;
}

function cleanGeminiPreambles(content: string): string {
  // Remove common Gemini preambles
  const preamblePatterns = [
    /^Here's an? .*?:\n\n/i,
    /^I'll .*?:\n\n/i,
    /^Okay, .*?:\n\n/i,
    /^Based on .*?:\n\n/i,
    /^Here's a draft.*?:\n\n/i,
    /^.*?based on your specifications:?\n\n/i,
    /^.*?SEO-optimized article.*?:\n\n/i
  ];

  let cleanedContent = content.trim();
  for (const pattern of preamblePatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // Also remove if the first line doesn't look like article content
  const firstLine = cleanedContent.split('\n')[0];
  if (
    firstLine.toLowerCase().includes('here') ||
    firstLine.toLowerCase().includes("i'll") ||
    firstLine.toLowerCase().includes('based on')
  ) {
    cleanedContent = cleanedContent.substring(cleanedContent.indexOf('\n') + 1).trim();
  }

  return cleanedContent;
}

// Mock article generation for development
async function mockGenerateArticle(description: string, primaryKeyword: string, selectedHeadline: string, selectedKeywords: string[]) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  const content = `In today's competitive digital landscape, **${primaryKeyword}** has become more crucial than ever for businesses looking to establish their online presence and drive meaningful results. Whether you're a startup founder, marketing professional, or business owner, understanding the intricacies of **${selectedKeywords[0]}** can make the difference between success and mediocrity.

The world of **${primaryKeyword}** is constantly evolving, with new strategies and techniques emerging regularly. Recent studies show that companies implementing comprehensive **${selectedKeywords[1]}** strategies see an average increase of 40% in their overall performance metrics. This statistic alone highlights the importance of staying current with industry best practices.

## Understanding the Fundamentals

Before diving into advanced strategies, it's essential to grasp the core principles that drive successful **${primaryKeyword}** implementation. The foundation lies in understanding your target audience and their specific needs, preferences, and pain points.

**${selectedKeywords[2]}** plays a pivotal role in this process. By leveraging data-driven insights, businesses can create more targeted and effective campaigns that resonate with their intended audience. This approach not only improves engagement rates but also maximizes return on investment.

Consider these key factors when developing your strategy:

The integration of **${selectedKeywords[3]}** into your overall approach ensures comprehensive coverage of all essential elements. Modern consumers expect personalized experiences, and businesses that fail to deliver on this expectation often struggle to maintain competitive advantage.

## Advanced Strategies That Drive Results

Moving beyond basic implementation, successful **${primaryKeyword}** requires sophisticated techniques that address the nuances of modern consumer behavior. **${selectedKeywords[4]}** has emerged as a critical component in this advanced approach.

Industry leaders consistently emphasize the importance of continuous optimization and testing. This iterative process allows businesses to refine their strategies based on real-world performance data, leading to increasingly effective outcomes over time.

The role of technology in enhancing **${selectedKeywords[5]}** capabilities cannot be overstated. Artificial intelligence and machine learning algorithms now enable unprecedented levels of personalization and automation, streamlining processes that once required significant manual effort.

## Implementation Best Practices

Successfully executing a **${primaryKeyword}** strategy demands careful attention to detail and systematic implementation. **${selectedKeywords[6] || selectedKeywords[0]}** should be integrated seamlessly throughout all touchpoints of the customer journey.

Start by establishing clear objectives and key performance indicators. These metrics will serve as your roadmap, helping you measure progress and make data-driven adjustments as needed. Remember that **${selectedKeywords[7] || selectedKeywords[1]}** effectiveness often depends on consistent monitoring and optimization.

Collaboration between different departments within your organization ensures alignment and maximizes the impact of your efforts. When teams work together toward common goals, the synergistic effect often produces results that exceed individual contributions.

## Measuring Success and ROI

The true value of any **${primaryKeyword}** initiative lies in its measurable impact on business outcomes. **${selectedKeywords[8] || selectedKeywords[2]}** provides valuable insights into campaign performance and areas for improvement.

Establish a comprehensive analytics framework that tracks both short-term and long-term metrics. While immediate results are important, the compound effect of sustained **${selectedKeywords[9] || selectedKeywords[3]}** efforts often produces the most significant long-term value.

Regular reporting and analysis enable proactive adjustments to your strategy, ensuring optimal performance even as market conditions and consumer preferences evolve.

## Conclusion

The landscape of **${primaryKeyword}** continues to evolve at a rapid pace, presenting both opportunities and challenges for businesses across all industries. Success in this environment requires a combination of strategic thinking, tactical execution, and continuous adaptation.

By focusing on **${selectedKeywords[0]}** and implementing the strategies outlined in this guide, organizations can position themselves for sustainable growth and competitive advantage. The key lies in maintaining a balance between proven methodologies and innovative approaches that address emerging trends and technologies.

Remember that **${primaryKeyword}** is not a one-time effort but an ongoing process that requires dedication, resources, and patience. The businesses that understand this fundamental truth and commit to long-term excellence will ultimately reap the greatest rewards in today's dynamic marketplace.`;

  // Clean the content by removing any H1 markdown from the beginning
  let cleanedContent = cleanGeminiPreambles(content.trim());
  
  // If content starts with H1 markdown, remove the entire first line
  if (cleanedContent.startsWith('# ')) {
    const firstNewlineIndex = cleanedContent.indexOf('\n');
    if (firstNewlineIndex !== -1) {
      cleanedContent = cleanedContent.substring(firstNewlineIndex + 1).trim();
    } else {
      // If no newline found, the H1 is the only content, so clear it
      cleanedContent = '';
    }
  }

  const metrics = calculateArticleMetrics(cleanedContent, primaryKeyword, selectedKeywords);
  const keywordDensityValid = validateKeywordDensity(cleanedContent, primaryKeyword);

  console.log('Structure validation (mock):', { valid: true, missing: [] });
  console.log('Keyword density valid (mock):', keywordDensityValid);

  return {
    content: cleanedContent,
    title: selectedHeadline,
    ...metrics
  };
}

// Helper function for retries with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error occurred during retry attempts');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on specific API errors that won't succeed on retry
      if (error instanceof Error) {
        if (error.message.includes('SAFETY') || 
            error.message.includes('RECITATION') ||
            error.message.includes('400')) {
          throw error; // Don't retry these errors
        }
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

interface CreativeContext {
  businessVertical?: string;
  targetAudience?: string;
  keyThemes?: string[];
  emotionalTriggers?: string[];
  marketingHooks?: string[];
  suggestedStructure?: Array<{ title: string; content: string }>;
}

function validateArticleStructure(
  article: string,
  requiredSections: Array<{ title: string; content: string }> | undefined
): { valid: boolean; missing: string[] } {
  if (!requiredSections || requiredSections.length === 0) {
    return { valid: true, missing: [] };
  }

  const missing: string[] = [];

  for (const section of requiredSections) {
    // Check multiple patterns for section headings
    const patterns = [
      new RegExp(`##\\s*${section.title}`, 'i'),
      new RegExp(`##\\s*.*${section.title.split(':')[0]}`, 'i'),
      // For year ranges, check if the years appear in a heading
      new RegExp(`##\\s*.*${section.title.match(/\\d{4}/)?.[0] || section.title}`, 'i'),
    ];

    const found = patterns.some(pattern => pattern.test(article));

    if (!found) {
      missing.push(section.title);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

async function generateWithGemini(
  description: string,
  primaryKeyword: string,
  selectedHeadline: string,
  selectedKeywords: string[],
  creativeContext?: CreativeContext
) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('No Gemini API key found, using mock data');
    return mockGenerateArticle(description, primaryKeyword, selectedHeadline, selectedKeywords);
  }

  return await retryWithBackoff(async () => {
    const prompt = `
      Write a professional, SEO-optimized article with these specifications:
      
      ARTICLE REQUIREMENTS:
      - Title: "${selectedHeadline}"
      - Primary keyword: "${primaryKeyword}"
      - Target keywords to include: ${selectedKeywords.join(', ')}
      - Word count: Exactly 800 words (750-850 acceptable)
      - Content description: ${description}
      
      RESEARCH REQUIREMENTS:
      - Search the web for current statistics, trends, and insights related to "${primaryKeyword}"
      - Include recent data and examples from authoritative sources
      - Reference current industry best practices and emerging trends

      ${creativeContext ? `
CREATIVE CONTEXT:
- Business Type: ${creativeContext.businessVertical}
- Target Audience: ${creativeContext.targetAudience}
- Key Themes to Cover: ${creativeContext.keyThemes?.join(', ')}
- Article should appeal to: ${creativeContext.emotionalTriggers?.join(' and ')}

STRUCTURE GUIDANCE FROM CREATIVE:
${creativeContext.suggestedStructure?.map(s => `- ${s.title}`).join('\n')}

MANDATORY STRUCTURE:

H2 SUBHEADING REQUIREMENTS:
For each required section, create engaging H2 headings that:
- Include the primary keyword naturally (in at least 2 headings)
- Reflect the specific benefit or problem addressed in that section
- Avoid generic phrases like 'Your Guide to' or 'Overview'
- Use action words and specific outcomes

Templates based on section type:
- Year ranges: '[Primary Keyword] [Year]: [Specific Problem/Benefit]'
- Product types: '[Primary Keyword] for [Type]: [Unique Value Proposition]'
- Numbered items: '[Number]. [Specific Action/Check] for [Primary Keyword]'

Example transformations:
BAD: 'Hatchbacks: Your Guide to Affordable Cars'
GOOD: 'Used Car EMI for Hatchbacks: Maximum Savings, Minimum Space'
` : ''}

      SEO SPECIFICATIONS:
      - CRITICAL SEO RULE: The primary keyword '${primaryKeyword}' should appear naturally within the first 3-5 words of:
        • The opening sentence of the article
        • At least 2 out of your H2 section headings
        • The first sentence after each H2 heading
        Do NOT force it as the very first word if it makes the sentence awkward.
      - Include 3-4 H2 sections (## format)
      - Keyword density: 0.5-0.8% maximum
      - Bold the primary keyword and 4-5 other important keywords using **text**
      - Natural, conversational tone
      - Grade 8 reading level
      - Active voice
      - Include current statistics and insights
      - NEVER mention "SEO", "optimization", or "keywords" in the content

      KEYWORD DISTRIBUTION RULES:
      - Primary keyword '${primaryKeyword}': Use exactly 4-6 times throughout the article
        • Once in opening paragraph
        • Once in 2-3 H2 headings (naturally)
        • 2-3 times in body paragraphs
      - Secondary keywords: Use each 1-2 times maximum
      - NEVER use the same keyword phrase in consecutive sentences
      - Prioritize natural language flow over keyword insertion
      - Use pronouns and synonyms to avoid repetition

      STRUCTURE:
      1. Compelling introduction with primary keyword
      2. 3-4 main sections with H2 headings
      3. Strong conclusion
      
      Write the article in markdown format without including the title as H1 since it will be displayed separately. Start directly with the introduction paragraph. Focus on providing genuine value and insights while naturally incorporating the target keywords.
      
      Use web search results to ensure the content is current, accurate, and includes the latest industry insights and statistics.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        tools: [{
          google_search: {}
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error ${response.status}:`, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('Full Gemini API response:', JSON.stringify(data, null, 2));
    
    // Check for content safety issues
    if (data.candidates && data.candidates[0]?.finishReason) {
      const finishReason = data.candidates[0].finishReason;
      console.log('Finish reason:', finishReason);
      
      if (finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try with different keywords or description.');
      }
      if (finishReason === 'RECITATION') {
        throw new Error('Content was blocked due to recitation concerns. Please try with more original content.');
      }
      if (finishReason === 'OTHER') {
        throw new Error('Content generation was blocked for unknown reasons. Please try again.');
      }
    }
    
    const content = data.candidates[0]?.content?.parts[0]?.text;
    
    console.log('Extracted content length:', content?.length || 0);
    console.log('Content preview:', content?.substring(0, 200) + '...');
    
    if (!content || content.trim().length === 0) {
      console.error('No content in response. Full response:', data);
      throw new Error('No content generated. The API returned an empty response.');
    }
    
    // Check if content is too short (likely incomplete)
    if (content.trim().length < 500) {
      console.warn('Generated content is unusually short:', content.length, 'characters');
      console.warn('Short content:', content);
    }

    // Clean the content by removing any H1 markdown from the beginning
    let cleanedContent = cleanGeminiPreambles(content.trim());
    
    // If content starts with H1 markdown, remove the entire first line
    if (cleanedContent.startsWith('# ')) {
      const firstNewlineIndex = cleanedContent.indexOf('\n');
      if (firstNewlineIndex !== -1) {
        cleanedContent = cleanedContent.substring(firstNewlineIndex + 1).trim();
      } else {
        // If no newline found, the H1 is the only content, so clear it
        cleanedContent = '';
      }
    }

    let validation: { valid: boolean; missing: string[] } | undefined;

    // Validate structure if creative context was provided
    if (creativeContext?.suggestedStructure) {
      validation = validateArticleStructure(cleanedContent, creativeContext.suggestedStructure);

      if (!validation.valid) {
        console.warn('Article missing required sections:', validation.missing);

        // Optionally retry with stronger enforcement
        if (validation.missing.length > creativeContext.suggestedStructure.length / 2) {
          console.error('Article severely misaligned with creative structure');
          // Could trigger a retry here with even stronger prompt
        }
      }
    }

    const metrics = calculateArticleMetrics(cleanedContent, primaryKeyword, selectedKeywords);
    const keywordDensityValid = validateKeywordDensity(cleanedContent, primaryKeyword);

    if (validation) {
      console.log('Structure validation result:', validation);
    }
    console.log('Keyword density valid:', keywordDensityValid);

    return {
      content: cleanedContent,
      title: selectedHeadline,
      ...metrics
    };

  }, 3, 1000); // 3 retries with 1 second base delay
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, primaryKeyword, selectedHeadline, selectedKeywords, creativeContext } = body;

    // Validate input
    if (!description || !primaryKeyword || !selectedHeadline || !selectedKeywords?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (selectedKeywords.length < 5 || selectedKeywords.length > 10) {
      return NextResponse.json(
        { error: 'Please select 5-10 keywords for optimal results' },
        { status: 400 }
      );
    }

    const article = await generateWithGemini(description, primaryKeyword, selectedHeadline, selectedKeywords, creativeContext);

    return NextResponse.json({ article });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}