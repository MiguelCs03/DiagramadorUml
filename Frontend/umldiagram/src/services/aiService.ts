import type { UMLDiagram, UMLEntity, UMLRelation, UMLAttribute, DataType, Visibility, RelationType, EntityType } from '../types/uml';
import { CardinalityUtils } from '../types/uml';

// Groq API Configuration
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface DiagramGenerationRequest {
  description: string;
  businessContext?: string;
  additionalRequirements?: string;
}

export interface DiagramGenerationResponse {
  success: boolean;
  diagram?: UMLDiagram;
  error?: string;
  explanation?: string;
}

export class AIService {
  static async generateDiagram(request: DiagramGenerationRequest): Promise<DiagramGenerationResponse> {
    try {
      const prompt = this.createPrompt(request);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an expert UML diagram designer. Your task is to generate a comprehensive UML class diagram based on the user's description. 

IMPORTANT: Respond ONLY with valid JSON in the exact format specified below. Do not include any explanations, markdown formatting, or additional text.

Expected JSON format:
{
  "entities": [
    {
      "id": "unique_id",
      "name": "ClassName",
      "type": "class|interface|abstract|enum",
      "position": {"x": number, "y": number},
      "attributes": [
        {
          "name": "attributeName",
          "type": "String|int|boolean|etc",
          "visibility": "public|private|protected|package"
        }
      ],
      "methods": [
        {
          "name": "methodName",
          "returnType": "void|String|int|etc",
          "parameters": [{"name": "paramName", "type": "paramType"}],
          "visibility": "public|private|protected|package"
        }
      ]
    }
  ],
  "relations": [
    {
      "id": "unique_relation_id",
      "sourceId": "source_entity_id",
      "targetId": "target_entity_id",
      "type": "inheritance|composition|aggregation|association|dependency|implementation",
      "sourceCardinality": "0..1|1|0..*|1..*|etc",
      "targetCardinality": "0..1|1|0..*|1..*|etc"
    }
  ]
}

Generate realistic and meaningful class diagrams with:
- Proper inheritance hierarchies where applicable
- Appropriate relationships between classes
- Realistic attributes and methods for each class
- Proper visibility modifiers
- Logical positioning (try to space entities evenly)

Available types: String, int, boolean, double, float, long, char, Date, List<T>, Set<T>, Map<K,V>
Available visibilities: public, private, protected, package
Available entity types: class, interface, abstract, enum
Available relation types: inheritance, composition, aggregation, association, dependency, implementation`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from Groq API');
      }

      console.log('AI Response:', content);

      // Parse the JSON response
      const parsedResponse = this.parseAIResponse(content);
      
      if (!parsedResponse) {
        throw new Error('Failed to parse AI response as valid JSON');
      }

      // Convert to UML diagram format
      const diagram = this.convertToUMLDiagram(parsedResponse);

      return {
        success: true,
        diagram,
        explanation: `Generated UML diagram with ${diagram.entities.length} entities and ${diagram.relations.length} relations.`
      };

    } catch (error) {
      console.error('Error generating diagram:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static createPrompt(request: DiagramGenerationRequest): string {
    let prompt = `Generate a UML class diagram for: ${request.description}`;
    
    if (request.businessContext) {
      prompt += `\n\nBusiness Context: ${request.businessContext}`;
    }
    
    if (request.additionalRequirements) {
      prompt += `\n\nAdditional Requirements: ${request.additionalRequirements}`;
    }

    prompt += `\n\nMake sure to include:
- Proper entity relationships (inheritance, composition, association, etc.)
- Realistic attributes with appropriate data types
- Key methods for each class
- Proper visibility modifiers
- Position entities in a logical layout`;

    return prompt;
  }

  private static parseAIResponse(content: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON block found, try to parse the entire content
      return JSON.parse(content.trim());
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      return null;
    }
  }

  private static convertToUMLDiagram(aiResponse: any): UMLDiagram {
    const entities: UMLEntity[] = [];
    const relations: UMLRelation[] = [];

    // Convert entities
    if (aiResponse.entities && Array.isArray(aiResponse.entities)) {
      for (const entity of aiResponse.entities) {
        const umlEntity: UMLEntity = {
          id: entity.id || `entity-${Date.now()}-${Math.random()}`,
          name: entity.name || 'UnnamedClass',
          type: this.mapEntityType(entity.type),
          attributes: [],
          methods: []
        };

        // Convert attributes
        if (entity.attributes && Array.isArray(entity.attributes)) {
          umlEntity.attributes = entity.attributes.map((attr: any, index: number) => ({
            id: `attr-${umlEntity.id}-${index}`,
            name: attr.name || 'attribute',
            type: this.mapDataType(attr.type),
            visibility: this.mapVisibility(attr.visibility),
            isKey: attr.isKey || false,
            defaultValue: attr.defaultValue
          }));
        }

        // Convert methods
        if (entity.methods && Array.isArray(entity.methods)) {
          umlEntity.methods = entity.methods.map((method: any, index: number) => ({
            id: `method-${umlEntity.id}-${index}`,
            name: method.name || 'method',
            returnType: this.mapDataType(method.returnType),
            visibility: this.mapVisibility(method.visibility),
            parameters: method.parameters ? method.parameters.map((param: any, paramIndex: number) => ({
              id: `param-${umlEntity.id}-${index}-${paramIndex}`,
              name: param.name || 'param',
              type: this.mapDataType(param.type)
            })) : [],
            isStatic: method.isStatic || false,
            isAbstract: method.isAbstract || false
          }));
        }

        entities.push(umlEntity);
      }
    }

    // Convert relations
    if (aiResponse.relations && Array.isArray(aiResponse.relations)) {
      for (const relation of aiResponse.relations) {
        const umlRelation: UMLRelation = {
          id: relation.id || `relation-${Date.now()}-${Math.random()}`,
          source: relation.sourceId,
          target: relation.targetId,
          type: this.mapRelationType(relation.type),
          sourceCardinality: CardinalityUtils.parseCardinality(relation.sourceCardinality || '1'),
          targetCardinality: CardinalityUtils.parseCardinality(relation.targetCardinality || '1'),
          label: relation.label
        };

        relations.push(umlRelation);
      }
    }

    return {
      id: `diagram-${Date.now()}`,
      name: aiResponse.name || 'Generated UML Diagram',
      entities,
      relations,
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0.0'
      }
    };
  }

  private static mapEntityType(type: string): EntityType {
    switch (type?.toLowerCase()) {
      case 'interface': return 'interface';
      case 'abstract': return 'abstract';
      case 'enum': return 'enum';
      default: return 'class';
    }
  }

  private static mapDataType(type: string): DataType {
    if (!type) return 'String';
    
    const typeMap: { [key: string]: DataType } = {
      'string': 'String',
      'str': 'String',
      'text': 'String',
      'int': 'Integer',
      'integer': 'Integer',
      'number': 'Integer',
      'long': 'Long',
      'double': 'Double',
      'float': 'Double',
      'boolean': 'Boolean',
      'bool': 'Boolean',
      'date': 'Date',
      'datetime': 'DateTime',
      'timestamp': 'DateTime'
    };

    const lowerType = type.toLowerCase();
    return typeMap[lowerType] || type as DataType;
  }

  private static mapVisibility(visibility: string): Visibility {
    switch (visibility?.toLowerCase()) {
      case 'public': return 'public';
      case 'private': return 'private';
      case 'protected': return 'protected';
      case 'package': return 'package';
      default: return 'private';
    }
  }

  private static mapRelationType(type: string): RelationType {
    switch (type?.toLowerCase()) {
      case 'inheritance': return 'inheritance';
      case 'composition': return 'composition';
      case 'aggregation': return 'aggregation';
      case 'association': return 'association';
      case 'dependency': return 'dependency';
      case 'implementation': return 'implementation';
      default: return 'association';
    }
  }

  // Chat functionality for conversational AI
  static async sendMessage(message: string, context?: UMLDiagram): Promise<{success: boolean, response?: string, error?: string}> {
    try {
      let systemPrompt = `You are an expert UML diagram assistant. Help users understand, modify, and improve their UML diagrams. 
      
You can:
- Explain UML concepts and relationships
- Suggest improvements to existing diagrams
- Answer questions about diagram structure
- Provide best practices for UML design
- Help with specific entity or relationship modifications

Be helpful, concise, and technically accurate. If the user asks you to generate a new diagram, remind them to use the diagram generation feature instead.`;

      if (context) {
        systemPrompt += `\n\nCurrent diagram context:
- Name: ${context.name}
- Entities: ${context.entities.length} (${context.entities.map(e => e.name).join(', ')})
- Relations: ${context.relations.length}`;
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response received from AI');
      }

      return {
        success: true,
        response: content
      };

    } catch (error) {
      console.error('Error sending message to AI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Method to suggest improvements for existing diagrams
  static async suggestImprovements(diagram: UMLDiagram): Promise<string[]> {
    try {
      const diagramSummary = `
Diagram: ${diagram.name}
Entities: ${diagram.entities.map(e => `${e.name} (${e.type})`).join(', ')}
Relations: ${diagram.relations.map(r => `${r.source} -> ${r.target} (${r.type})`).join(', ')}
      `;

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an expert UML diagram reviewer. Analyze the provided UML diagram and suggest specific improvements. Focus on:
- Design patterns that could be applied
- Missing relationships or entities
- Better entity organization
- Normalization improvements
- Code generation optimization

Provide 3-5 specific, actionable suggestions. Return only a JSON array of strings, no additional formatting.

Example response format:
["Consider adding a BaseEntity class for common attributes like id and timestamps", "The User-Order relationship should be bidirectional", "Add a PaymentStatus enum for better order state management"]`
            },
            {
              role: "user",
              content: `Please analyze this UML diagram and suggest improvements: ${diagramSummary}`
            }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response received from AI');
      }

      // Try to parse as JSON array
      try {
        const suggestions = JSON.parse(content.trim());
        return Array.isArray(suggestions) ? suggestions : [content];
      } catch {
        // If not valid JSON, return as single suggestion
        return [content];
      }

    } catch (error) {
      console.error('Error getting suggestions:', error);
      return ['No se pudieron obtener sugerencias en este momento.'];
    }
  }
}