# ContentForge - Professional SEO Article Generation

A sophisticated Next.js 13.5 web application for generating SEO-optimized articles using Google Gemini AI with web grounding capabilities.

## Features

- **AI-Powered Content Generation**: Uses Google Gemini 2.0 Flash with web search grounding
- **SEO Optimization**: Automatic keyword density control, heading structure, and readability optimization
- **Interactive UI**: Smooth animations, keyword chip selection, and professional design
- **Auto-save**: Automatically saves your progress locally
- **Responsive Design**: Works across devices
- **Professional Article Formatting**
- **Article Analysis**: Word count, keyword density, reading time, and SEO scoring
- **Export Options**: Copy, download, and print functionality
- **Rate Limiting**: Planned feature, not yet implemented

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Get your Google Gemini API key from [Google AI Studio](https://aistudio.google.com)
   - Add your API key to `.env.local`:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Usage

1. **Input Phase**: Provide creative description, primary keyword, and relevant keywords
2. **AI Suggestions**: Review AI-generated headlines and keyword suggestions
3. **Selection**: Choose headline and 5-10 keywords for optimal SEO
4. **Generation**: Get professionally crafted 800-word articles
5. **Review**: Analyze SEO metrics and export your content

## Technical Stack

- **Frontend**: Next.js 13.5, TypeScript, Tailwind CSS
- **AI**: Google Gemini 2.0 Flash with grounding
- **State Management**: React hooks with localStorage persistence
- **API**: Secure server-side integration (rate limiting planned)

## License

Professional tool for content creation teams.
