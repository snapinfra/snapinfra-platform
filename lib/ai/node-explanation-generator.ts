import { generateText } from 'ai';
import { groq, AI_CONFIG } from './groq-client';
import type { ArchitectureNode, NodeAIExplanation } from '@/lib/types/architecture';

interface GenerateNodeExplanationsParams {
  nodes: ArchitectureNode[];
  projectContext: {
    name: string;
    description?: string;
    schemas?: any[];
    apiEndpoints?: any[];
  };
  diagramType: 'HLD' | 'LLD' | 'DataFlow' | 'ERD' | 'APIMap';
}

export async function generateNodeExplanations(
  params: GenerateNodeExplanationsParams
): Promise<ArchitectureNode[]> {
  const { nodes, projectContext, diagramType } = params;

  // Generate explanations for all nodes in a single API call for efficiency
  const systemPrompt = `You are an expert software architect explaining architectural decisions.

Project Context:
- Name: ${projectContext.name}
- Description: ${projectContext.description || 'N/A'}
- Diagram Type: ${diagramType}

Generate explanations for each node in the architecture diagram. For each node, provide:
1. **Why Chosen**: Brief explanation of why this component/technology was selected (1-2 sentences)
2. **How It Fits**: How this component integrates with the overall architecture (1-2 sentences)
3. **Tradeoffs**: Key alternatives considered and why this was preferred (1-2 sentences)
4. **Best Practices**: Implementation tips, configuration recommendations, or gotchas (1-2 sentences)

Be concise, technical, and helpful. Use a friendly but professional tone.`;

  const userPrompt = `Generate explanations for the following nodes:

${nodes.map((node, idx) => `
Node ${idx + 1}:
- Name: ${node.data.name}
- Type: ${node.type}
- Description: ${node.data.description || 'N/A'}
`).join('\n')}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "nodeId": "node-id-here",
    "whyChosen": "...",
    "howItFits": "...",
    "tradeoffs": "...",
    "bestPractices": "..."
  }
]

Important: Return valid JSON only, no markdown formatting, no code blocks.`;

  try {
    const { text } = await generateText({
      model: groq(AI_CONFIG.model),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Lower temperature for more consistent output
      maxTokens: AI_CONFIG.maxTokens,
    });

    // Parse the response
    let explanations: Array<{ nodeId: string } & NodeAIExplanation>;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      explanations = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Invalid JSON response from AI');
    }

    // Map explanations back to nodes
    const nodesWithExplanations = nodes.map((node) => {
      const explanation = explanations.find((exp) => exp.nodeId === node.id);

      if (explanation) {
        return {
          ...node,
          data: {
            ...node.data,
            aiExplanation: {
              whyChosen: explanation.whyChosen,
              howItFits: explanation.howItFits,
              tradeoffs: explanation.tradeoffs,
              bestPractices: explanation.bestPractices,
            },
          },
        };
      }

      // Fallback if explanation not found
      return {
        ...node,
        data: {
          ...node.data,
          aiExplanation: {
            whyChosen: `${node.data.name} provides essential ${node.type} functionality for this architecture.`,
            howItFits: `Integrates with other components to handle ${node.type} responsibilities.`,
            tradeoffs: `Selected for its balance of performance, scalability, and ease of integration.`,
            bestPractices: `Follow standard ${node.type} best practices for configuration and deployment.`,
          },
        },
      };
    });

    return nodesWithExplanations;
  } catch (error) {
    console.error('Error generating node explanations:', error);

    // Return nodes with fallback explanations on error
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        aiExplanation: {
          whyChosen: `${node.data.name} was selected to provide ${node.type} capabilities.`,
          howItFits: `This component plays a key role in the overall system architecture.`,
          tradeoffs: `Chosen for its proven reliability and compatibility with the tech stack.`,
          bestPractices: `Ensure proper configuration and monitoring for optimal performance.`,
        },
      },
    }));
  }
}
