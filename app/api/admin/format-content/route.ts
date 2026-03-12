import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/format-content
 * Uses Google Gemini to clean up and format content into proper markdown.
 * Accepts: { content: string, mode: 'fix' | 'full' }
 *   - 'fix': Fix formatting issues, grammar, code blocks
 *   - 'full': Full rewrite with proper structure
 */
export async function POST(request: NextRequest) {
    try {
        const { content, mode = 'fix' } = await request.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: 'GEMINI_API_KEY not configured. Add it to your .env file.',
                hint: 'Get a free API key from https://aistudio.google.com/apikey'
            }, { status: 500 });
        }

        const systemPrompt = mode === 'full'
            ? `You are a technical content editor. Rewrite the following content about programming/interview preparation into well-structured, professional markdown. 

Rules:
- Use proper markdown: # for main title, ## for sections, ### for subsections
- Format all code with proper fenced code blocks with language tags (e.g. \`\`\`javascript, \`\`\`python, \`\`\`html)
- Fix any spelling, grammar, or technical errors
- Use bullet points and numbered lists where appropriate
- Add emphasis with **bold** for important terms
- Use inline \`code\` for variable names, function names, file paths
- Add clear explanations before code examples
- Keep the content technical and interview-focused
- Do NOT add any conversational text or meta-commentary
- Return ONLY the formatted markdown content, nothing else`
            : `You are a markdown formatter. Clean up the following content into properly formatted markdown.

Rules:
- Fix broken markdown syntax (missing backticks, wrong heading levels, etc.)
- Ensure code blocks have proper language tags (javascript, python, html, css, etc.)
- Fix indentation and spacing issues
- Correct obvious spelling/grammar errors
- Preserve all the original content and meaning
- Do NOT add new content or change technical details
- Return ONLY the cleaned markdown, nothing else`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            { text: `\n\nContent to format:\n\n${content}` }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            return NextResponse.json({
                error: 'AI formatting failed',
                details: response.status === 403 ? 'Invalid API key' : 'API error'
            }, { status: 500 });
        }

        const data = await response.json();
        const formattedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!formattedContent) {
            return NextResponse.json({ error: 'No content returned from AI' }, { status: 500 });
        }

        // Clean up any markdown code fence wrapper the AI might add
        let cleaned = formattedContent;
        if (cleaned.startsWith('```markdown')) {
            cleaned = cleaned.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
        } else if (cleaned.startsWith('```md')) {
            cleaned = cleaned.replace(/^```md\n?/, '').replace(/\n?```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        return NextResponse.json({ formatted: cleaned.trim() });
    } catch (error: any) {
        console.error('Format content error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
