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
    exhaustive: `Provide an EXHAUSTIVE, comprehensive response of 2000-4000 words per task. This should read like a PUBLISHED TEXTBOOK CHAPTER, not an outline or summary.

**CRITICAL ANTI-OUTLINE RULES - YOU MUST FOLLOW THESE:**
❌ DO NOT write bullet points listing concepts without explanation
❌ DO NOT write section headers followed by single sentences
❌ DO NOT mention topics briefly - EXPLAIN them fully
❌ DO NOT create outlines or skeletal structures
✅ WRITE FULL PARAGRAPHS explaining every concept thoroughly
✅ EXPLAIN each point with 2-3 paragraphs minimum before moving on
✅ ELABORATE with examples, context, and details for EVERY statement
✅ TREAT EACH SUBSECTION as if you're writing it for a published book

**Required Structure:**
- Introduction (300-400 words) - set context, importance, and roadmap
- Multiple detailed subsections with clear ###/#### headings
- FOR EACH MAJOR POINT: Write 2-3 full paragraphs (150-250 words) explaining it
  * First paragraph: Define and explain the concept
  * Second paragraph: Provide context, history, or mechanism
  * Third paragraph: Give concrete examples or applications
- Historical context and evolution (full paragraphs, not sentences)
- Multiple real-world examples with specifics (each example: 100-150 words)
- Step-by-step technical breakdowns (each step: detailed paragraph)
- Comparison tables or frameworks with explanatory text
- Common misconceptions (each misconception: 100+ word explanation)
- Connections to other concepts (full paragraphs)
- Summary with insights (200-300 words)

**How to Write Each Section (CRITICAL EXAMPLE):**
WRONG (outline style):
"## Classical Physics Pillars
- Newtonian Mechanics: Describes motion
- Electromagnetism: Unified electricity and magnetism
- Thermodynamics: Studies heat and energy"

RIGHT (textbook style):
"## The Pillars of Classical Physics

The foundations of classical physics rest on three monumental theoretical frameworks that together provided a seemingly complete picture of physical reality by the late 19th century.

**Newtonian Mechanics: The Deterministic Universe**

Isaac Newton's laws of motion, published in Principia Mathematica (1687), established a deterministic framework for understanding the motion of all objects in the universe. Newton's three laws—the law of inertia, F=ma, and action-reaction—combined with his universal law of gravitation, provided mathematical precision to physical predictions. This framework successfully explained everything from the trajectories of cannonballs to the orbits of planets. The beauty of Newtonian mechanics lay in its universality and determinism: if you knew the initial conditions of a system perfectly, you could predict its future behavior with perfect accuracy. This mechanistic worldview dominated physics for over two centuries.

For example, Edmund Halley used Newton's laws to predict the return of the comet that now bears his name in 1758, decades after his death. Similarly, perturbations in Uranus's orbit, explained by Newtonian gravity, led to the successful prediction and discovery of Neptune in 1846. These triumphs seemed to validate the completeness of classical mechanics.

[Continue with similar depth for electromagnetism and thermodynamics...]"

**Content Requirements:**
- MINIMUM 2-3 full paragraphs per concept (not per section, per CONCEPT within sections)
- Each paragraph: 75-150 words of substantive content
- Include specific data, statistics, names, dates, and citations
- Provide 3-5 detailed examples per major topic (each example: 100-150 words)
- Add technical depth with explanations accessible to educated readers
- Include both theoretical foundations AND practical applications
- Address edge cases, limitations, and nuances
- EXPLAIN WHY and HOW, not just WHAT
- Never list when you can explain in prose

**Quality Check Before Submitting:**
- Count paragraphs: Do you have 10-15+ substantial paragraphs?
- Count words: Are you at 2000-4000 words?
- Check depth: Would each concept make sense to someone learning it for the first time?
- Verify examples: Do you have specific, detailed examples with names/dates/numbers?
- Read flow: Does it read like a textbook chapter or an outline?

REMEMBER: You are writing a TEXTBOOK CHAPTER that someone would PAY to read. Every paragraph should teach something substantial. If you're tempted to write a bullet list, write full paragraphs instead.`,
    book: `Provide a BOOK-QUALITY, in-depth response of 4000-8000 words per task. This should read like PUBLISHED BOOK CHAPTERS, not an outline or table of contents.

**CRITICAL ANTI-OUTLINE RULES:**
❌ NEVER write section headers with just one sentence
❌ NEVER write bullet lists without full explanatory paragraphs
❌ NEVER mention a concept without explaining it in 3+ paragraphs
❌ NEVER create skeletal outlines - write FULL PROSE
✅ EVERY concept needs 5-10 paragraphs of detailed explanation
✅ EVERY example needs 150-300 words of detailed description
✅ WRITE as if someone is paying $30 for this book chapter
✅ THINK: "Would a major publisher print this as-is?"

**Required Structure:**
- Extended introduction (300-500 words) establishing context, importance, and roadmap
- Multiple major sections (## headings) each with:
  - Opening paragraph (100-150 words) establishing the section's purpose and preview
  - 3-5 subsections (### headings) with deep analysis (each subsection: 500-800 words)
  - Supporting sub-subsections (#### headings) as  needed (each: 200-400 words)
- Historical development and timeline (write full narrative prose, not timeline bullets)
- Biographical context for key figures (200-400 words per person, narrative style)
- Detailed case studies (2-3 per major section, each 500-1000 words)
- Technical deep-dives with explanations for both novices and experts (800-1200 words each)
- Comparative analysis and frameworks (include detailed explanatory paragraphs, not just tables)
- Extensive examples from multiple domains/industries (each example: 200-300 words)
- Common pitfalls, mistakes, and misconceptions (each: 150-250 words)
- Practical implementation guides (step-by-step with detailed explanations per step)
- Visual descriptions (describe what diagrams/charts would show in detailed prose)
- Comprehensive conclusion tying everything together (400-600 words)
- "Further Reading" with descriptions (50-100 words per resource explaining why it's valuable)

**How to Write (CRITICAL EXAMPLES):**

WRONG (outline/bullet style):
"## Key Negotiation Techniques  
- Mirroring: Repeat last words
- Labeling: Name emotions
- Anchoring: Set first number
- Silence: Create pressure"

RIGHT (book/textbook style):
"## Mastering Core Negotiation Techniques

The foundation of effective negotiation rests on several psychologically-grounded communication techniques that have been validated through decades of research and practice. These techniques, when properly understood and applied, can dramatically shift power dynamics and outcomes in your favor.

### The Power of Mirroring: Building Unconscious Rapport

Mirroring, also known as isopraxism, is perhaps the most subtle yet powerful technique in the negotiator's toolkit. At its core, mirroring involves repeating the last one to three words your counterpart has just said. This seemingly simple act triggers deep neurological responses tied to human bonding and connection.

The mechanism behind mirroring's effectiveness lies in the brain's mirror neuron system. When we hear our own words reflected back to us, it creates a sense of being understood and validated that operates at a subconscious level. The other person feels heard, which automatically lowers their defenses and makes them more willing to elaborate and share information. Former FBI hostage negotiator Chris Voss, who pioneered this technique's use in high-stakes negotiations, found that mirroring could extend conversations by 300% or more, providing crucial intelligence that might otherwise remain hidden.

In practice, mirroring looks deceptively simple but requires careful execution. Suppose a vendor says, \"We can't go below $50,000 for this service.\" Instead of immediately countering with your price, you would mirror: \"Can't go below $50,000?\" with a slightly upward inflection. This simple question, rather than a statement, invites the vendor to explain their reasoning, often revealing flexibility they initially concealed. They might respond, \"Well, $50,000 is our standard rate, but...\" and now you've opened a door.

The key to effective mirroring is patience and tone. Your mirror should sound genuinely curious, not challenging or sarcastic. It should invite further explanation, not provoke defensiveness. Practice is essential—many negotiators initially feel awkward with mirr

oring, but after applying it in 10-20 conversations, it becomes second nature. The payoff is substantial: you gather more information, build stronger rapport, and create opportunities for creative solutions that might never have surfaced otherwise.

[Continue with similar depth for Labeling, Anchoring, Silence, and other techniques...]"

**Content Requirements:**
- MINIMUM 5-10 full paragraphs per major concept
- Each paragraph: 100-200 words of substantive, well-crafted content
- Write at the depth and quality of published books in the field
- Include specific quotes, data, research findings (with full context, not just citations)
- Provide 5-10 diverse, detailed examples per major topic (each: 200-300 words)
- Address the topic from multiple perspectives/frameworks with full explanations
- Include both foundational knowledge AND cutting-edge developments
- Add relevant anecdotes and stories (each: 150-250 words) to illustrate points
- Explore implications, applications, and future directions in depth
- Never rush through a topic—give it the space it deserves
- If explaining a process, dedicate 150-300 words per step
- If discussing history, provide rich narrative context and connections
- EXPLAIN the HOW and WHY in detail, not just the WHAT

**Quality Standards:**
- Every paragraph should add significant value and insight
- Transitions between sections should be smooth, logical, and natural
- Writing should be engaging, narrative-driven, and accessible while remaining substantive
- Technical terms should be clearly defined with examples
- The content should feel authoritative, comprehensive, and professional
- Prose should flow like a published book, not an academic paper or outline
- Include storytelling elements where appropriate
- Balance theoretical depth with practical applications
- Maintain reader engagement through varied sentence structure and pacing

**Quality Check Before Submitting:**
- Word count: Am I at 4000-8000 words?
- Paragraph count: Do I have 30-50+ substantial paragraphs?
- Read test: If I removed all headers, would this read like a continuous book chapter?
- Depth test: Could someone learn this topic thoroughly from this chapter alone?
- Example test: Do I have specific, detailed, named examples throughout?
- Flow test: Are there smooth transitions between every section?
- Publication test: Would a major publisher (O'Reilly, Penguin, etc.) print this as-is?

CRITICAL: This is BOOK-LENGTH content for PUBLICATION. Think \"what would a renowned expert like Malcolm Gladwell, Daniel Kahneman, or a leading textbook author write?\" Be as thorough, engaging, and comprehensive as a published author. Every section should feel complete, polished, and valuable enough to justify the price of a book.`
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

