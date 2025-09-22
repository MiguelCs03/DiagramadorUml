
"use client";
import React, { useState } from 'react';
import type { RelationType, EntityType, Cardinality } from '../types/uml';

interface SidebarProps {
  selectedTool: string | null;
  onSelectTool: (tool: string | null) => void;
  onCreateEntity: (type: EntityType) => void;
  onCreateRelation: (type: RelationType) => void;
  onGenerateCode: () => void;
  onExportDiagram: () => void;
  onImportDiagram: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedTool,
  onSelectTool,
  onCreateEntity,
  onCreateRelation,
  onGenerateCode,
  onExportDiagram,
  onImportDiagram
}) => {
  const [activeSection, setActiveSection] = useState<string>('entities');

  const entityTypes: { type: EntityType; label: string; icon: string; description: string }[] = [
    { type: 'class', label: 'Class', icon: '📦', description: 'Standard class' },
    { type: 'abstract', label: 'Abstract Class', icon: '📋', description: 'Abstract class' },
    { type: 'interface', label: 'Interface', icon: '🔌', description: 'Interface definition' },
    { type: 'enum', label: 'Enumeration', icon: '📝', description: 'Enumeration type' },
  ];

  const relationTypes: { type: RelationType; label: string; icon: string; description: string }[] = [
    { type: 'association', label: 'Association', icon: '↔️', description: 'General association' },
    { type: 'aggregation', label: 'Aggregation', icon: '◇', description: 'Weak "has-a" relationship' },
    { type: 'composition', label: 'Composition', icon: '◆', description: 'Strong "part-of" relationship' },
    { type: 'inheritance', label: 'Inheritance', icon: '▷', description: 'IS-A relationship' },
    { type: 'implementation', label: 'Implementation', icon: '▷', description: 'Interface implementation' },
    { type: 'dependency', label: 'Dependency', icon: '⋯▷', description: 'Dependency relationship' },
  ];

  const handleEntityClick = (type: EntityType) => {
    onSelectTool(`entity-${type}`);
    onCreateEntity(type);
  };

  const handleRelationClick = (type: RelationType) => {
    onSelectTool(`relation-${type}`);
    onCreateRelation(type);
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">UML Diagram Editor</h2>
        
        {/* Navigation tabs */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveSection('entities')}
            className={`px-3 py-2 text-sm font-medium ${
              activeSection === 'entities'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Entities
          </button>
          <button
            onClick={() => setActiveSection('relations')}
            className={`px-3 py-2 text-sm font-medium ${
              activeSection === 'relations'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Relations
          </button>
          <button
            onClick={() => setActiveSection('tools')}
            className={`px-3 py-2 text-sm font-medium ${
              activeSection === 'tools'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tools
          </button>
        </div>

        {/* Entities Section */}
        {activeSection === 'entities' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Create Entities</h3>
            {entityTypes.map((entity) => (
              <button
                key={entity.type}
                onClick={() => handleEntityClick(entity.type)}
                className={`w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                  selectedTool === `entity-${entity.type}`
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-white border-gray-200'
                }`}
                title={entity.description}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{entity.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{entity.label}</div>
                    <div className="text-xs text-gray-500">{entity.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Relations Section */}
        {activeSection === 'relations' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Create Relations</h3>
            <div className="text-xs text-gray-600 mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              💡 Tip: Select a relation type, then click and drag from one entity to another to create the relationship.
            </div>
            {relationTypes.map((relation) => (
              <button
                key={relation.type}
                onClick={() => handleRelationClick(relation.type)}
                className={`w-full p-3 text-left border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors ${
                  selectedTool === `relation-${relation.type}`
                    ? 'bg-green-100 border-green-400'
                    : 'bg-white border-gray-200'
                }`}
                title={relation.description}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{relation.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{relation.label}</div>
                    <div className="text-xs text-gray-500">{relation.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tools Section */}
        {activeSection === 'tools' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Diagram Tools</h3>
            
            {/* Diagram Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Diagram</h4>
              <button
                onClick={onExportDiagram}
                className="w-full p-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>📤</span>
                  <span className="text-sm">Export Diagram</span>
                </div>
              </button>
              <button
                onClick={onImportDiagram}
                className="w-full p-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>📥</span>
                  <span className="text-sm">Import Diagram</span>
                </div>
              </button>
            </div>

            {/* Code Generation */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Code Generation</h4>
              <button
                onClick={onGenerateCode}
                className="w-full p-3 text-left bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-colors shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <span>🚀</span>
                  <div>
                    <div className="font-medium">Generate Spring Boot</div>
                    <div className="text-xs opacity-90">Create DTOs, Models & CRUDs</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Validation */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Validation</h4>
              <button
                onClick={() => onSelectTool('validate')}
                className="w-full p-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>✅</span>
                  <span className="text-sm">Validate Diagram</span>
                </div>
              </button>
            </div>

            {/* AI Assistant */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">AI Assistant</h4>
              <button
                onClick={() => onSelectTool('ai-suggest')}
                className="w-full p-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>🤖</span>
                  <span className="text-sm">Suggest Improvements</span>
                </div>
              </button>
              <button
                onClick={() => onSelectTool('ai-chat')}
                className="w-full p-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>💬</span>
                  <span className="text-sm">Open AI Chat</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Selected Tool Indicator */}
        {selectedTool && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-medium text-blue-800 mb-1">Active Tool</div>
            <div className="text-sm text-blue-700 capitalize">{selectedTool.replace('-', ' ')}</div>
            <button
              onClick={() => onSelectTool(null)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Deselect Tool
            </button>
          </div>
        )}

        {/* Quick Help */}
        <div className="mt-6 p-3 bg-gray-100 border border-gray-200 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-2">Quick Help</div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Double-click entities to edit names</li>
            <li>• Use + buttons to add attributes/methods</li>
            <li>• Drag entities to reposition them</li>
            <li>• Many-to-many relations create intermediate tables</li>
            <li>• Use the AI assistant for suggestions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
