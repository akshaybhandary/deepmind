// Coordinator Agent - Analyzes prompts and creates task plans
import { getCompletion } from '../openrouter';
import { DEPTH_LEVELS } from '../../utils/constants';

const COORDINATOR_SYSTEM_PROMPT = `You are the Coordinator agent in a multi-agent analysis system. Your role is to:

1. Analyze the user's prompt and identify its category (research, planning, learning, problem-solving, etc.)
2. Break it down into a structured set of subtasks that other agents will execute
3. Determine the optimal sequence and dependencies between tasks

You must respond with a valid JSON object in this exact format:
{
  "title": "Brief title for the analysis",
  "category": "research|planning|learning|problem-solving|creative|technical",
  "summary": "One sentence summary of what we'll analyze",
  "tasks": [
    {
      "id": "task_1",
      "type": "researcher|analyst|critic|expander",
      "title": "Task title",
      "instruction": "Detailed instruction for this agent",
      "dependsOn": []
    }
  ]
}

Rules:
- Task count should match the depth level requested
- Each task should build on previous ones logically
- "researcher" gathers information, "analyst" finds patterns, "critic" challenges ideas, "expander" elaborates
- The instruction should be specific and actionable
- Dependencies should reference task IDs that must complete first

**For EXHAUSTIVE and BOOK depth levels, create comprehensive task plans that include:**
- Foundational/historical research tasks
- Deep analytical tasks exploring mechanisms and patterns
- Critical evaluation tasks examining limitations and controversies
- Expansion tasks adding examples, case studies, and applications
- Comparative analysis tasks showing relationships between concepts
- Practical application tasks
- Edge case and nuance exploration tasks
- FAQ and common misconception tasks
- Future trends and implications tasks
- Glossary and resource compilation tasks

Think: "What would a subject matter expert want to cover comprehensively?" Plan for breadth AND depth.`;

/**
 * Run the coordinator agent to create a task plan
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model ID to use
 * @param {string} prompt - User's analysis prompt
 * @param {string} depthLevel - Depth level ID
 * @returns {Promise<Object>} Task plan
 */
export async function runCoordinator(apiKey, model, prompt, depthLevel) {
    const depth = DEPTH_LEVELS.find(d => d.id === depthLevel) || DEPTH_LEVELS[1];

    const messages = [
        { role: 'system', content: COORDINATOR_SYSTEM_PROMPT },
        {
            role: 'user',
            content: `Analyze this prompt and create a task plan with ${depth.taskCount.min}-${depth.taskCount.max} tasks for ${depth.name} depth analysis.

User's prompt: "${prompt}"

Remember: Respond ONLY with valid JSON, no markdown or explanation.`
        }
    ];

    const response = await getCompletion(apiKey, model, messages);

    // Parse JSON from response
    try {
        // Try to extract JSON if wrapped in markdown
        let jsonStr = response;
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const plan = JSON.parse(jsonStr.trim());

        // Validate structure
        if (!plan.title || !plan.tasks || !Array.isArray(plan.tasks)) {
            throw new Error('Invalid plan structure');
        }

        return plan;
    } catch (error) {
        console.error('Failed to parse coordinator response:', response);
        throw new Error('Coordinator failed to create a valid task plan');
    }
}
