// Synthesizer Agent - Combines all outputs into cohesive results
import { streamCompletion } from '../openrouter';
import { DEPTH_LEVELS } from '../../utils/constants';

const getSynthesizerPrompt = (depthLevel) => {
    const depth = DEPTH_LEVELS.find(d => d.id === depthLevel) || DEPTH_LEVELS[1];

    const basePrompt = `You are the Synthesis Agent. Your role is to:
- Combine multiple analysis sections into a cohesive, well-structured document
- Ensure logical flow and eliminate redundancy
- Create an executive summary at the beginning
- Add a conclusion with key takeaways
- Organize content with clear headers and sections`;

    const formatGuides = {
        brief: `
Format guidelines:
- Brief executive summary (1-2 sentences)
- Use ## for main sections
- Condense to key points
- Short "Key Takeaways" at end`,

        moderate: `
Format guidelines:
- Start with a brief executive summary (2-3 sentences)
- Use ## for main sections, ### for subsections
- Use bullet points for lists
- Use **bold** for key terms
- End with a "Key Takeaways" section`,

        detailed: `
Format guidelines:
- Comprehensive executive summary (1 paragraph)
- Use ## for main sections, ### for subsections
- Elaborate on key concepts
- Include all important details
- Use tables where appropriate
- End with detailed "Key Takeaways" section`,

        exhaustive: `
Format guidelines for EXHAUSTIVE output (target: 50+ pages):
- Detailed executive summary (2-3 paragraphs)
- PRESERVE ALL CONTENT from the agents - do not cut or condense
- Use ## for main sections, ### for subsections, #### for sub-subsections
- Add your own insights and connections between sections
- Include transition paragraphs between major sections
- Create comprehensive tables summarizing key concepts
- Add a detailed introduction section
- Include methodology notes
- Create multiple appendix sections if relevant
- End with extensive "Conclusions and Key Takeaways"
- Add "Further Considerations" section
CRITICAL: Do NOT summarize or shorten. EXPAND and ELABORATE on every point.`,

        book: `
Format guidelines for BOOK-LENGTH output (target: 100+ pages):
- Extended executive summary (full page)
- PRESERVE AND EXPAND on ALL CONTENT from every agent
- Create a full Table of Contents structure
- Use ## for chapters, ### for sections, #### for subsections
- Write extensive transition and bridge paragraphs
- Add introductory paragraphs for each major section
- Include comprehensive tables, frameworks, and models
- Create detailed case study sections
- Add historical context where relevant
- Include implementation guides
- Write extensive conclusions for each chapter
- End with comprehensive "Final Thoughts and Future Directions"
- Add multiple appendices
CRITICAL: This is a BOOK. Be as comprehensive as a published work. Never summarize - always expand with additional context, examples, and analysis.`
    };

    return basePrompt + (formatGuides[depth.detailLevel] || formatGuides.moderate);
};

/**
 * Run the synthesizer agent to combine all results
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model ID to use
 * @param {Object} plan - Original task plan
 * @param {Object} taskResults - Results from all tasks
 * @param {Function} onChunk - Streaming callback
 * @param {AbortSignal} signal - Optional abort signal
 * @param {string} depthLevel - Depth level ID
 * @returns {Promise<string>} Synthesized result
 */
export async function runSynthesizer(apiKey, model, plan, taskResults, onChunk, signal, depthLevel = 'standard') {
    // Build content from all task results
    let contentSections = '';
    for (const task of plan.tasks) {
        if (taskResults[task.id]) {
            contentSections += `\n\n### ${task.title}\n${taskResults[task.id]}`;
        }
    }

    const depth = DEPTH_LEVELS.find(d => d.id === depthLevel) || DEPTH_LEVELS[1];
    const isDeep = ['exhaustive', 'book'].includes(depthLevel);

    // Use more tokens for synthesizer to prevent cutoff
    // New models support 32K-65K output, so we can use higher limits
    const maxTokens = isDeep ? 32000 : 16000;

    const messages = [
        { role: 'system', content: getSynthesizerPrompt(depthLevel) },
        {
            role: 'user',
            content: `Original topic: "${plan.title}" (${plan.category})
Summary: ${plan.summary}

The following sections have been analyzed by ${plan.tasks.length} specialized agents. Synthesize them into a single, cohesive, and comprehensive document:

${contentSections}

Create a ${isDeep ? 'comprehensive, book-quality' : 'well-organized'} final document that:
1. Starts with ${isDeep ? 'an extensive' : 'an'} Executive Summary
2. Flows logically through the key points
3. ${isDeep ? 'PRESERVES ALL DETAILS while adding connections and insights' : 'Eliminates redundancy while preserving important details'}
4. ${isDeep ? 'Includes extensive analysis and examples' : 'Ends with Key Takeaways'}
${isDeep ? '5. Expands on each section with additional context\n6. Adds comprehensive conclusions and future considerations' : ''}

IMPORTANT: Complete the entire document. Do not stop mid-sentence or leave sections incomplete.
Use proper markdown formatting. ${isDeep ? 'Remember: DO NOT SHORTEN OR SUMMARIZE. Your goal is maximum comprehensiveness.' : ''}`
        }
    ];

    return streamCompletion(apiKey, model, messages, onChunk, signal, maxTokens);
}


