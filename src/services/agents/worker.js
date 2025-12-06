// Worker Agents - Execute specific analysis tasks
import { streamCompletion } from '../openrouter';
import { DEPTH_LEVELS } from '../../utils/constants';

const AGENT_PROMPTS = {
    researcher: `You are a Research Agent. Your role is to:
- Gather comprehensive, research-backed information about the topic
- Explore different perspectives, schools of thought, and methodologies
- Identify key facts, concepts, frameworks, and proven approaches
- For practical topics: research the scientific/psychological foundations
- For academic topics: trace historical development and key discoveries
- Cite specific studies, experts, books, or established methods where relevant
- Provide well-structured, authoritative content

Be thorough and detailed. Use headers, subheaders, bullet points, and examples. Ground everything in research and evidence.`,

    analyst: `You are an Analysis Agent. Your role is to:
- Examine information deeply and find patterns and mechanisms
- Identify relationships between concepts, causes and effects
- Compare and contrast different approaches or frameworks
- For practical topics: analyze WHY techniques work (psychology, neuroscience, behavioral science)
- For academic topics: analyze underlying principles and theoretical foundations
- Draw evidence-based insights and conclusions
- Provide data-driven or logic-driven analysis with supporting research

Be analytical and precise. Support every claim with reasoning, research, and examples.`,

    critic: `You are a Critical Analysis Agent. Your role is to:
- Challenge assumptions, oversimplifications, and common beliefs
- Identify potential weaknesses, limitations, or gaps in approaches
- For practical topics: explore what doesn't work, common mistakes, and edge cases
- For academic topics: examine controversies, unsolved problems, and competing theories
- Consider alternative viewpoints and perspectives
- Highlight risks, considerations, and nuances often overlooked
- Question popular but unproven claims

Be constructive but thorough. Question everything and explore what people get wrong.`,

    expander: `You are an Expansion Agent. Your role is to:
- Elaborate on concepts with rich detail, examples, and context
- For practical topics: provide step-by-step how-to guides, practice exercises, and implementation plans
- For academic topics: add case studies, real-world applications, and implications
- Make abstract concepts concrete with multiple diverse examples
- Add actionable steps, techniques, or recommendations
- Include troubleshooting guidance and FAQs
- Provide frameworks, checklists, or templates where helpful
- Cover different scenarios, contexts, and levels (beginner to advanced)

Be detailed and supremely practical. Turn knowledge into action. Include complete step-by-step guides where applicable.`
};

const DEPTH_INSTRUCTIONS = {
    brief: 'Provide a concise response of 150-300 words.',
    moderate: 'Provide a thorough response of 300-500 words with examples.',
    detailed: 'Provide a comprehensive response of 500-800 words with examples and subheaders.',
    exhaustive: `Provide an EXHAUSTIVE, comprehensive response of 2000-4000 words per task. This should feel like a chapter in a textbook. Include:

**Required Structure:**
- Introduction (set context and importance)
- Multiple detailed subsections with clear ###/#### headings
- Deep dive into every major point (minimum 2-3 paragraphs per point)
- Historical context and evolution where relevant
- Multiple real-world examples with specifics (names, dates, numbers)
- Step-by-step technical breakdowns with details
- Comparison tables or frameworks where applicable
- Common misconceptions or FAQ items
- Connections to other concepts
- Summary with insights and implications

**Content Requirements:**
- Be COMPREHENSIVE, not concise. Elaborate fully on each point.
- Include specific data, statistics, names, dates, and citations where relevant.
- Provide 3-5 concrete examples per major concept.
- Add technical depth without sacrificing clarity.
- Include both theory AND practice.
- Address edge cases and nuances.
- Never summarize when you can elaborate.

IMPORTANT: This is an EXHAUSTIVE analysis. More detail is always better. Aim for depth that rivals academic papers or comprehensive textbook chapters.`,
    book: `Provide a BOOK-QUALITY, in-depth response of 4000-8000 words per task. This should read like multiple chapters from a published work. Include:

**Required Structure:**
- Extended introduction (300-500 words) establishing context, importance, and roadmap
- Multiple major sections (## headings) each with:
  - Opening paragraph establishing the section's purpose
  - 3-5 subsections (### headings) with deep analysis
  - Supporting sub-subsections (#### headings) as needed
- Historical development and timeline
- Biographical context for key figures (where relevant)
- Detailed case studies (2-3 per major section)
- Technical deep-dives with explanations for both novices and experts
- Comparative analysis and frameworks
- Extensive examples from multiple domains/industries
- Common pitfalls, mistakes, and misconceptions
- Practical implementation guides
- Visual descriptions (suggest where diagrams/charts would help)
- Comprehensive conclusion tying everything together
- "Further Reading" or reference suggestions

**Content Requirements:**
- Write at the depth and quality of published books in the field.
- Each major concept should get 5-10 paragraphs of coverage.
- Provide 5-10 diverse, detailed examples per major topic.
- Include specific quotes, data, research findings (with context).
- Address the topic from multiple perspectives/frameworks.
- Include both foundational knowledge and cutting-edge developments.
- Add relevant anecdotes and stories to illustrate points.
- Explore implications, applications, and future directions.
- Never rush through a topic—give it the space it deserves.
- If explaining a process, break it into detailed steps.
- If discussing history, provide rich context and connections.

**Quality Standards:**
- Every paragraph should add significant value.
- Transitions between sections should be smooth and logical.
- Writing should be engaging and accessible while substantive.
- Technical terms should be clearly defined.
- The content should feel authoritative and comprehensive.

CRITICAL: This is BOOK-LENGTH content. Think "what would a renowned expert write in their definitive book on this topic?" Be as thorough as a published author.`
};

/**
 * Run a worker agent
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model ID to use
 * @param {string} agentType - Type of agent (researcher, analyst, critic, expander)
 * @param {Object} task - Task to execute
 * @param {Object} context - Previous task results
 * @param {Function} onChunk - Streaming callback
 * @param {AbortSignal} signal - Optional abort signal
 * @param {string} depthLevel - Depth level ID
 * @returns {Promise<string>} Task result
 */
export async function runWorker(apiKey, model, agentType, task, context, onChunk, signal, depthLevel = 'standard') {
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.researcher;
    const depth = DEPTH_LEVELS.find(d => d.id === depthLevel) || DEPTH_LEVELS[1];
    const depthInstruction = DEPTH_INSTRUCTIONS[depth.detailLevel] || DEPTH_INSTRUCTIONS.moderate;

    // Build context from previous tasks
    let contextText = '';
    if (context && Object.keys(context).length > 0) {
        contextText = '\n\nContext from previous analysis:\n';
        for (const [taskId, result] of Object.entries(context)) {
            if (task.dependsOn?.includes(taskId)) {
                contextText += `\n---\n${result}\n---\n`;
            }
        }
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: `${task.instruction}${contextText}

${depthInstruction}

Use markdown formatting with headers (##, ###), bullet points, numbered lists, **bold**, and *italics* for emphasis. Structure your response professionally.`
        }
    ];

    return streamCompletion(apiKey, model, messages, onChunk, signal);
}

