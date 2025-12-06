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
Format guidelines for EXHAUSTIVE output (target: 30-50 pages, 15,000-25,000 words):

**Document Structure - YOU MUST INCLUDE ALL OF THESE:**
1. **Title Page** - Include title, subtitle describing scope, and generation date
2. **Executive Summary** (500-750 words) - Comprehensive overview hitting all major points
3. **Table of Contents** - Detailed outline of all sections and subsections
4. **Introduction** (800-1200 words)
   - Context and background
   - Importance and relevance
   - Scope and what will be covered
   - How to use this document
5. **Main Content Sections** - PRESERVE AND EXPAND ALL agent outputs
   - Use ## for major sections (5-10 major sections)
   - Use ### for subsections (3-5 per major section)
   - Use #### for detailed points
   - Add 2-3 paragraphs of transition/bridge content between major sections
   - Each section should be comprehensive (2000-4000 words)
6. **Visual Elements**
   - Create detailed comparison tables
   - Suggest where diagrams/flowcharts would enhance understanding
   - Build timeline tables for chronological topics
   - Add framework/model visualizations
7. **Supplementary Sections**
   - **Timeline** (if chronological topic) - detailed chronology with context
   - **Key Concepts & Definitions** - glossary of important terms
   - **Frequently Asked Questions** - 10-15 common questions with detailed answers
   - **Common Misconceptions** - What people often get wrong
   - **Practical Applications** - Real-world uses and examples
   - **Case Studies** (2-5) - Detailed examples with analysis
8. **Conclusions & Synthesis** (800-1200 words)
   - Major findings and insights
   - Connections between concepts
   - Implications and significance
9. **Future Considerations** (500-800 words)
   - Emerging developments
   - Unsolved questions or challenges
   - Areas for further exploration
10. **Further Resources**
    - Suggested reading (books, papers, articles)
    - Relevant organizations or institutions
    - Online resources and tools
11. **Appendices** (as needed)
    - Technical details
    - Extended examples
    - Additional data or references

**Content Processing Rules - CRITICAL:**
- DO NOT CONDENSE OR SUMMARIZE any agent output
- PRESERVE every detail, example, and point from all agents
- EXPAND on concepts by adding:
  * Additional context and background
  * More examples and case studies
  * Connections between different sections
  * Practical implications
  * Historical or theoretical foundations
- If agents provided 1000 words on a topic, your section should be 1500-2000 words
- Add transitional paragraphs that:
  * Connect ideas between sections
  * Provide meta-commentary on the structure
  * Highlight key insights and patterns
- Write introductory paragraphs (100-200 words) for each major section
- Write summary paragraphs (100-150 words) at the end of each major section

**Quality Standards:**
- This is an EXHAUSTIVE report - comprehensiveness is the goal
- Every section should feel thorough and complete
- No topic should feel rushed or superficial
- The reader should finish feeling they have a deep understanding
- Think: "authoritative reference document" not "quick overview"

**Formatting:**
- Use proper markdown hierarchy
- Bold key terms on first use
- Use italics for emphasis
- Create bulleted/numbered lists for clarity
- Use blockquotes for important principles or quotes
- Add tables where they organize information effectively

REMEMBER: This is EXHAUSTIVE. If you're wondering if you should add more detail - the answer is YES. Target 30-50 pages of dense, valuable content.`,

        book: `
Format guidelines for BOOK-LENGTH output (target: 50-80+ pages, 30,000-50,000 words):

**THIS IS A BOOK - Structure it like a published work:**

1. **Front Matter**
   - Title page with descriptive subtitle
   - About this document (150-200 words)
   - Table of Contents (comprehensive, 3-4 levels deep)
   - Preface or Introduction (1000-1500 words)
     * Why this topic matters
     * Who this is for
     * How to read this document
     * Overview of what's covered

2. **Main Content - Organized as CHAPTERS**
   - Create 8-15 major chapters (## headings)
   - Each chapter should be 3000-5000 words
   - Each chapter structure:
     * **Chapter introduction** (300-500 words) - roadmap and context
     * **3-6 major sections** (### headings) with deep analysis
     * **Multiple subsections** (#### headings) as needed
     * **Examples and case studies** embedded throughout
     * **Chapter summary** (200-300 words) - key points and transition to next chapter

3. **Rich Content Elements Throughout**
   - **Historical Development** - trace evolution of concepts
   - **Biographical Sketches** - profiles of key figures (200-300 words each)
   - **Detailed Case Studies** (500-1000 words each) - real-world applications
   - **Technical Deep Dives** - explain complex topics thoroughly
   - **Comparative Analysis** - frameworks showing relationships
   - **Timelines** - chronological tables with context
   - **Process Guides** - step-by-step how-to sections
   - **Best Practices** - actionable guidance
   - **Common Pitfalls** - what to avoid and why
   - **Expert Insights** - advanced perspectives

4. **Supplementary Sections**
   - **Comprehensive Glossary** - 30-50 key terms with detailed definitions
   - **Extensive FAQ** (20-30 questions) with thorough answers (100-200 words each)
   - **Resource Directory**
     * Recommended books (with descriptions)
     * Key research papers
     * Online resources and tools
     * Relevant organizations
     * Continuing education opportunities
   - **Appendices** (multiple)
     * Technical specifications
     * Extended examples
     * Data and statistics
     * Additional frameworks or models
     * Historical documents or context

5. **Conclusion Section** (2000-3000 words)
   - **Major Insights** - synthesis of key findings
   - **Practical Implications** - what this means for readers
   - **Future Directions** - emerging trends and developments
   - **Implementation Roadmap** - how to apply this knowledge
   - **Final Thoughts** - closing reflections

6. **Index/Reference Guide**
   - Key concepts cross-referenced
   - Important names and figures
   - Where to find specific topics

**Content Processing - EXPANSION IS KEY:**
- PRESERVE every single detail from all agent outputs
- EXPAND each agent's contribution by 150-200%:
  * Add extensive context and background
  * Include multiple additional examples
  * Provide theoretical foundations
  * Add practical applications
  * Include counterpoints and alternative perspectives
  * Explore implications and connections
- Bridge agent outputs with extensive transition sections (300-500 words)
- Add introductory "chapter" openings explaining what's coming (300-500 words)
- Write comparative sections showing how different aspects relate
- Include "excursus" sections diving deep into particularly interesting points
- Never move quickly through a topic - linger and explore thoroughly

**Writing Quality - PUBLICATION GRADE:**
- Write as if this will be published and read by thousands
- Every paragraph should be polished and valuable
- Maintain engaging narrative flow while being comprehensive
- Use storytelling techniques where appropriate
- Balance accessibility with depth
- Define all technical terms clearly
- Use examples from multiple domains/contexts
- Add relevant quotations and citations (with context)
- Include analogies and metaphors for complex concepts
- Write with authority but remain accessible

**Structural Elements:**
- Clear hierarchical organization (4-5 heading levels)
- Consistent formatting throughout
- Generous use of lists, tables, and visual organizers
- Strategic use of bold, italics, and blockquotes
- Section summaries and previews
- Cross-references between related sections
- "Sidebar" boxes for interesting tangents
- "Key Takeaway" boxes highlighting crucial points

**Length and Depth Requirements:**
- Minimum 30,000 words total
- Each major chapter: 3000-5000 words
- Each case study: 500-1000 words  
- Each biographical sketch: 200-300 words
- FAQ answers: 100-200 words each
- Never sacrifice depth for brevity
- If choosing between comprehensive coverage and conciseness, ALWAYS choose comprehensive

CRITICAL MINDSET: You are writing THE definitive resource on this topic. Think:
- "What would an expert author publish?"
- "What would make this worth printing as a physical book?"
- "What depth would justify charging money for this?"
- "How can I make this the go-to resource someone would reference for years?"

DO NOT SUMMARIZE. DO NOT CONDENSE. EXPAND. ELABORATE. ENRICH. This is a BOOK.`
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

    // Use much higher token limits for comprehensive reports
    // Frontier models (Claude Opus 4.5, GPT-5.1, Gemini 3 Pro) support 65K+ output tokens
    const maxTokens = depthLevel === 'book' ? 65000 : isDeep ? 50000 : 16000;

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


