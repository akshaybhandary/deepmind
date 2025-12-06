// Worker Agents - Execute specific analysis tasks
import { streamCompletion } from '../openrouter';
import { DEPTH_LEVELS } from '../../utils/constants';

const AGENT_PROMPTS = {
    researcher: `You are a Research Agent. Your role is to:
- Gather comprehensive information about the topic
- Explore different perspectives and sources
- Identify key facts, concepts, and frameworks
- Provide well-structured, informative content

Be thorough and detailed. Use headers, subheaders, bullet points, and examples.`,

    analyst: `You are an Analysis Agent. Your role is to:
- Examine information deeply and find patterns
- Identify relationships between concepts
- Draw insights and conclusions
- Provide data-driven or logic-driven analysis

Be analytical and precise. Support claims with reasoning and examples.`,

    critic: `You are a Critical Analysis Agent. Your role is to:
- Challenge assumptions and common beliefs
- Identify potential weaknesses or gaps
- Consider alternative viewpoints
- Highlight risks or considerations

Be constructive but thorough. Question everything and explore edge cases.`,

    expander: `You are an Expansion Agent. Your role is to:
- Elaborate on concepts with examples and details
- Add practical applications and use cases
- Provide actionable steps or recommendations
- Make abstract concepts concrete with real examples

Be detailed and practical. Include step-by-step guides where applicable.`
};

const DEPTH_INSTRUCTIONS = {
    brief: 'Provide a concise response of 150-300 words.',
    moderate: 'Provide a thorough response of 300-500 words with examples.',
    detailed: 'Provide a comprehensive response of 500-800 words with examples and subheaders.',
    exhaustive: `Provide a very comprehensive response of 800-1200 words. Include:
- Clear subsections with headings
- Real-world examples
- Step-by-step breakdowns where applicable
- Key insights and takeaways`,
    book: `Provide a detailed response of 1500-2500 words. Include:
- Introduction and context
- Multiple sections with subheaders
- Examples and case studies
- Practical applications
- Summary and key takeaways`
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

