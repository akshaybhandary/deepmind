// Main Orchestrator - Coordinates all agents
import { runCoordinator } from './agents/coordinator';
import { runWorker } from './agents/worker';
import { runSynthesizer } from './agents/synthesizer';
import { AGENT_TYPES } from '../utils/constants';

/**
 * Main orchestration function
 * @param {Object} options
 * @param {string} options.apiKey - OpenRouter API key
 * @param {string} options.prompt - User's prompt
 * @param {string} options.depth - Depth level
 * @param {Object} options.modelAssignments - Model assignments per agent type
 * @param {Object} options.callbacks - Event callbacks
 * @param {AbortSignal} options.signal - Abort signal
 */
export async function runAnalysis({
    apiKey,
    prompt,
    depth,
    modelAssignments,
    callbacks = {},
    signal
}) {
    const {
        onAgentStart,
        onAgentProgress,
        onAgentComplete,
        onProgress,
        onStreamChunk,
        onComplete,
        onError
    } = callbacks;

    let plan = null;
    const taskResults = {};

    try {
        // Phase 1: Coordinator creates the plan
        onAgentStart?.('coordinator', 'Analyzing prompt and creating task plan...');

        plan = await runCoordinator(
            apiKey,
            modelAssignments.coordinator,
            prompt,
            depth
        );

        onAgentComplete?.('coordinator', `Created ${plan.tasks.length} tasks`);
        onProgress?.(10);

        // Phase 2: Execute worker tasks
        const totalTasks = plan.tasks.length;
        const progressPerTask = 70 / totalTasks; // 70% for workers
        let currentProgress = 10;

        for (let i = 0; i < plan.tasks.length; i++) {
            if (signal?.aborted) throw new Error('Analysis cancelled');

            const task = plan.tasks[i];
            const agentType = task.type || 'researcher';
            const model = modelAssignments[agentType] || modelAssignments.researcher;

            // Check dependencies
            const canRun = !task.dependsOn?.length ||
                task.dependsOn.every(depId => taskResults[depId]);

            if (!canRun) {
                console.warn(`Skipping task ${task.id} - dependencies not met`);
                continue;
            }

            onAgentStart?.(agentType, task.title);

            // Build context from completed tasks
            const context = {};
            if (task.dependsOn) {
                for (const depId of task.dependsOn) {
                    if (taskResults[depId]) {
                        context[depId] = taskResults[depId];
                    }
                }
            }

            // Run the worker with streaming
            let taskOutput = '';
            const result = await runWorker(
                apiKey,
                model,
                agentType,
                task,
                context,
                (chunk) => {
                    taskOutput += chunk;
                    onAgentProgress?.(agentType, taskOutput);
                    onStreamChunk?.(chunk);
                },
                signal,
                depth  // Pass depth level for content length instructions
            );

            // Validate worker output
            if (!result?.trim()) {
                console.warn(`Worker ${agentType} for task "${task.title}" returned empty result`);
                // Still continue, but don't store the result - synthesis may work without it
            } else {
                taskResults[task.id] = result;
            }

            currentProgress += progressPerTask;
            onProgress?.(Math.round(currentProgress));
            onAgentComplete?.(agentType, `Completed: ${task.title}`);
        }

        // Phase 3: Synthesizer combines results
        if (signal?.aborted) throw new Error('Analysis cancelled');

        onAgentStart?.('synthesizer', 'Combining analysis results...');
        onProgress?.(85);

        let finalOutput = '';
        const synthesized = await runSynthesizer(
            apiKey,
            modelAssignments.synthesizer,
            plan,
            taskResults,
            (chunk) => {
                finalOutput += chunk;
                onAgentProgress?.('synthesizer', finalOutput);
                onStreamChunk?.(chunk);
            },
            signal,
            depth  // Pass depth level for output length
        );

        onAgentComplete?.('synthesizer', 'Analysis complete');
        onProgress?.(100);

        // Validate that we have content - if synthesis failed but we have task results, use them
        let finalContent = synthesized;

        if (!finalContent?.trim()) {
            console.warn('Synthesis produced empty content, building from task results...');

            // Check if we have any task results to fall back to
            const taskResultsContent = Object.entries(taskResults)
                .map(([taskId, content]) => {
                    const task = plan.tasks.find(t => t.id === taskId);
                    return `## ${task?.title || taskId}\n\n${content}`;
                })
                .join('\n\n---\n\n');

            if (taskResultsContent?.trim()) {
                finalContent = `# ${plan.title}\n\n*Note: Synthesis was unable to complete, showing individual agent results.*\n\n${taskResultsContent}`;
                console.log('Using fallback content from task results');
            } else {
                // No content at all - this is an error
                throw new Error('Analysis produced no content. Please try again.');
            }
        }

        const result = {
            title: plan.title,
            category: plan.category,
            summary: plan.summary,
            content: finalContent,
            tasks: plan.tasks.map(t => ({
                ...t,
                result: taskResults[t.id]
            })),
            meta: {
                depth,
                tasksCompleted: Object.keys(taskResults).length,
                totalTasks: plan.tasks.length,
                usedFallback: finalContent !== synthesized
            }
        };

        onComplete?.(result);
        return result;

    } catch (error) {
        if (error.message !== 'Analysis cancelled') {
            console.error('Analysis error:', error);
        }
        onError?.(error);
        throw error;
    }
}

/**
 * Get estimated time for analysis
 * @param {string} depth - Depth level
 * @returns {string} Estimated time string
 */
export function getEstimatedTime(depth) {
    const estimates = {
        quick: '30 seconds',
        standard: '1-2 minutes',
        deep: '2-3 minutes',
        exhaustive: '3-5 minutes'
    };
    return estimates[depth] || '1-2 minutes';
}
