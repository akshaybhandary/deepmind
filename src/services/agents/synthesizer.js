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

**CRITICAL: DO NOT CREATE AN OUTLINE OR TABLE OF CONTENTS AS THE MAIN CONTENT**
You are writing the ACTUAL BOOK/TEXTBOOK, not a summary or outline of what a book would contain.

**ANTI-OUTLINE RULES:**
❌ DO NOT write section headers followed by brief descriptions
❌ DO NOT list what each section will cover without actually writing it
❌ DO NOT create a skeletal structure - WRITE THE FULL CONTENT
❌ DO NOT summarize agent outputs - EXPAND them with full prose
✅ WRITE COMPLETE PARAGRAPHS for every single point
✅ PRESERVE AND EXPAND all agent content into flowing prose
✅ ADD transitional paragraphs, introductions, and summaries
✅ MAKE IT READ like a published textbook, not a course syllabus

**Document Structure - YOU MUST INCLUDE ALL OF THESE:**
1. **Title Page** - Include title, subtitle describing scope, and generation date
2. **Executive Summary** (500-750 words) - Comprehensive prose overview hitting all major points with full paragraphs
3. **Table of Contents** - Detailed outline (this is the ONLY place where outlines are acceptable)
4. **Introduction** (800-1200 words) - FULL PROSE with multiple paragraphs:
   - Context and background (2-3 paragraphs)
   - Importance and relevance (2 paragraphs)
   - Scope and what will be covered (1-2 paragraphs)
   - How to use this document (1 paragraph)
5. **Main Content Sections** - WRITE IN FULL PROSE, NOT OUTLINES
   - Use ## for major sections (5-10 major sections)
   - Each major section: 2000-4000 words of FULL PARAGRAPH TEXT
   - Use ### for subsections (3-5 per major section)
   - Each subsection: 400-800 words of DETAILED PROSE
   - Use #### for detailed points
   - FOR EVERY POINT: Write 2-3 full explanatory paragraphs (150-250 words)
   - ADD transition paragraphs (100-150 words) between major sections explaining connections
   - EXPAND agent outputs by 150-200% with context, examples, and elaboration
6. **Visual Elements** - Describe in prose, create detailed tables
   - Create detailed comparison tables with explanatory text
   - Write paragraphs describing what diagrams would show
   - Build timeline tables for chronological topics with contextual descriptions
   - Add framework/model visualizations as tables/data with prose explanations
7. **Supplementary Sections** - ALL IN FULL PROSE
   - **Timeline** (if chronological topic) - Write chronology as narrative prose with dates, not just bullet points
   - **Key Concepts & Definitions** - Each term gets 2-3 paragraphs explaining it thoroughly
   - **Frequently Asked Questions** - 10-15 questions with DETAILED ANSWER PARAGRAPHS (150-300 words each)
   - **Common Misconceptions** - Each misconception explained in 2-3 paragraphs (200-300 words)
   - **Practical Applications** - Write detailed scenarios and examples in full prose
   - **Case Studies** (2-5) - Each case study: 500-800 words of narrative prose
8. **Conclusions & Synthesis** (800-1200 words) - Full paragraphs:
   - Major findings and insights (3-4 paragraphs)
   - Connections between concepts (2-3 paragraphs)
   - Implications and significance (2 paragraphs)
9. **Future Considerations** (500-800 words) - Full prose sections:
   - Emerging developments (2-3 paragraphs)
   - Unsolved questions or challenges (2 paragraphs)
   - Areas for further exploration (1-2 paragraphs)
10. **Further Resources** - With descriptions in prose
    - Suggested reading with 50-100 word descriptions of each book/paper
    - Relevant organizations with descriptions
    - Online resources and tools with explanations
11. **Appendices** (as needed) - Full prose content in appendices too
    - Technical details explained in paragraphs
    - Extended examples as narrative
    - Additional data with interpretive text

**Content Processing Rules - CRITICAL:**
- DO NOT CONDENSE OR SUMMARIZE any agent output
- PRESERVE every detail, example, and point from all agents
- WRITE EVERYTHING IN FULL FLOWING PROSE - think continuous narrative
- EXPAND on concepts by adding (in full paragraphs):
  * Additional context and background
  * More examples and case studies
  * Connections between different sections
  * Practical implications
  * Historical or theoretical foundations
- If agents provided 1000 words on a topic, EXPAND it to 1500-2000 words of prose
- Add transitional paragraphs (100-200 words) that:
  * Connect ideas between sections with smooth narrative flow
  * Provide meta-commentary on the structure
  * Highlight key insights and patterns
- Write introductory paragraphs (100-200 words) for each major section explaining what's coming
- Write summary paragraphs (100-150 words) at the end of each major section synthesizing key points

**Quality Standards:**
- This is an EXHAUSTIVE report - comprehensiveness is the goal
- Every section should feel thorough and complete with full prose
- No topic should feel rushed or superficial
- ELIMINATE all outline-style writing - convert everything to flowing paragraphs
- The reader should finish feeling they have a deep understanding
- Think: "authoritative reference textbook" not "quick overview" or "table of contents"

**Formatting:**
- Use proper markdown hierarchy
- Bold key terms on first use
- Use italics for emphasis
- Create bulleted/numbered lists ONLY where they genuinely help (not as replacements for paragraphs)
- Use blockquotes for important principles or quotes
- Add tables where they organize information effectively (with prose explanations)
- PRIMARY CONTENT MUST BE FULL PROSE PARAGRAPHS

**BEFORE SUBMITTING - VERIFY:**
- Did I write actual paragraphs or just section descriptions?
- If I read a major section, do I see 2000-4000 words of continuous prose?
- Do FAQ answers have 150-300 words each, not one sentence?
- Did I expand agent content or just copy it?
- Is this a TEXTBOOK someone would study from, or a SUMMARY of what a textbook would cover?

REMEMBER: This is EXHAUSTIVE. You are writing the ACTUAL TEXTBOOK CONTENT, not describing what the textbook would contain. Every section needs FULL PROSE PARAGRAPHS explaining concepts thoroughly. If you're wondering if you should add more detail - the answer is YES. Target 30-50 pages of dense, valuable, FULLY-WRITTEN content.`,

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


