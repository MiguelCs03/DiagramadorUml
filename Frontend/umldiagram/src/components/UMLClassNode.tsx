"use client";
import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { UMLEntity, UMLAttribute, DataType, Visibility, UMLMethod } from '../types/uml';

interface UMLClassNodeData {
  entity: UMLEntity;
  onUpdateEntity?: (updatedEntity: UMLEntity) => void;
}

type UMLClassNodeProps = NodeProps<UMLClassNodeData>;

const DATA_TYPES: DataType[] = [
  'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 
  'Date', 'DateTime', 'BigDecimal', 'UUID', 'Text'
];

const VISIBILITIES: Visibility[] = ['public', 'private', 'protected', 'package'];

const UMLClassNode: React.FC<UMLClassNodeProps> = ({ data, selected }) => {
  const { entity, onUpdateEntity } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);

  // Estado para nuevos atributos
  const [newAttribute, setNewAttribute] = useState<Partial<UMLAttribute>>({
    name: '',
    type: 'String',
    visibility: 'private'
  });

  // Estado para nuevos métodos
  const [newMethod, setNewMethod] = useState({
    name: '',
    returnType: 'void' as DataType | 'void',
    visibility: 'public' as Visibility
  });

  const handleUpdateEntity = useCallback((updates: Partial<UMLEntity>) => {
    if (onUpdateEntity) {
      onUpdateEntity({ ...entity, ...updates });
    }
  }, [entity, onUpdateEntity]);

  const handleAddAttribute = useCallback(() => {
    if (newAttribute.name && newAttribute.type) {
      const attribute: UMLAttribute = {
        id: Date.now().toString(),
        name: newAttribute.name,
        type: newAttribute.type as DataType,
        visibility: newAttribute.visibility as Visibility,
        isKey: false
      };
      
      handleUpdateEntity({
        attributes: [...entity.attributes, attribute]
      });
      
      setNewAttribute({ name: '', type: 'String', visibility: 'private' });
      setShowAddAttribute(false);
    }
  }, [newAttribute, entity.attributes, handleUpdateEntity]);

  const handleRemoveAttribute = useCallback((attributeId: string) => {
    handleUpdateEntity({
      attributes: entity.attributes.filter(attr => attr.id !== attributeId)
    });
  }, [entity.attributes, handleUpdateEntity]);

  const handleUpdateAttribute = useCallback((attributeId: string, updates: Partial<UMLAttribute>) => {
    handleUpdateEntity({
      attributes: entity.attributes.map(attr => 
        attr.id === attributeId ? { ...attr, ...updates } : attr
      )
    });
    setEditingAttribute(null);
  }, [entity.attributes, handleUpdateEntity]);

  const handleAddMethod = useCallback(() => {
    if (newMethod.name) {
      const method: UMLMethod = {
        id: Date.now().toString(),
        name: newMethod.name,
        returnType: newMethod.returnType,
        visibility: newMethod.visibility,
        parameters: []
      };
      
      handleUpdateEntity({
        methods: [...(entity.methods || []), method]
      });
      
      setNewMethod({ name: '', returnType: 'void', visibility: 'public' });
      setShowAddMethod(false);
    }
  }, [newMethod, entity.methods, handleUpdateEntity]);

  const getVisibilitySymbol = (visibility: Visibility): string => {
    switch (visibility) {
      case 'public': return '+';
      case 'private': return '-';
      case 'protected': return '#';
      case 'package': return '~';
      default: return '';
    }
  };

  const getEntityTypeColor = (type: string): string => {
    switch (type) {
      case 'interface': return 'bg-green-700';
      case 'abstract': return 'bg-purple-700';
      case 'enum': return 'bg-orange-700';
      case 'intermediate': return 'bg-gray-600';
      default: return 'bg-blue-700';
    }
  };

  const getEntityTypeLabel = (type: string): string => {
    switch (type) {
      case 'interface': return '<<interface>>';
      case 'abstract': return '<<abstract>>';
      case 'enum': return '<<enumeration>>';
      case 'intermediate': return '<<intermediate>>';
      default: return '';
    }
  };

  return (
    <div className={`bg-white border-2 border-blue-700 rounded-lg shadow-lg min-w-[220px] max-w-[300px] ${selected ? 'ring-2 ring-blue-400' : ''}`}>
      {/* Handles para conexiones */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />

      {/* Header */}
      <div className={`${getEntityTypeColor(entity.type || 'class')} text-white px-3 py-2 rounded-t-lg`}>
        {entity.stereotype && (
          <div className="text-xs italic text-center">{entity.stereotype}</div>
        )}
        {getEntityTypeLabel(entity.type || 'class') && (
          <div className="text-xs italic text-center">{getEntityTypeLabel(entity.type || 'class')}</div>
        )}
        <div className="font-bold text-center">
          {isEditing ? (
            <input
              type="text"
              value={entity.name}
              onChange={(e) => handleUpdateEntity({ name: e.target.value })}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="bg-transparent border-b border-white text-center w-full text-white placeholder-gray-200"
              autoFocus
            />
          ) : (
            <span 
              onDoubleClick={() => setIsEditing(true)}
              className="cursor-pointer"
            >
              {entity.name}
            </span>
          )}
        </div>
      </div>

      {/* Attributes Section */}
      <div className="border-b border-gray-300">
        <div className="px-3 py-1 bg-gray-50 text-xs font-semibold text-gray-700 flex justify-between items-center">
          <span>Attributes</span>
          <button
            onClick={() => setShowAddAttribute(!showAddAttribute)}
            className="text-blue-600 hover:text-blue-800 text-lg font-bold"
            title="Add attribute"
          >
            +
          </button>
        </div>
        
        {/* Add new attribute form */}
        {showAddAttribute && (
          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Attribute name"
                value={newAttribute.name}
                onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                className="w-full text-xs px-2 py-1 border rounded text-blue-700 font-semibold placeholder-blue-400"
              />
              <div className="flex space-x-1">
                <select
                  value={newAttribute.visibility}
                  onChange={(e) => setNewAttribute({ ...newAttribute, visibility: e.target.value as Visibility })}
                  className="text-xs px-1 py-1 border rounded flex-1"
                >
                  {VISIBILITIES.map(vis => (
                    <option key={vis} value={vis}>{vis}</option>
                  ))}
                </select>
                <select
                  value={newAttribute.type}
                  onChange={(e) => setNewAttribute({ ...newAttribute, type: e.target.value as DataType })}
                  className="text-xs px-1 py-1 border rounded flex-2 text-gray-700 font-semibold"
                >
                  {DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={handleAddAttribute}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddAttribute(false)}
                  className="text-xs px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attributes list */}
        <div className="px-3 py-2 max-h-32 overflow-y-auto">
          {entity.attributes.length === 0 ? (
            <div className="text-gray-400 italic text-xs">No attributes</div>
          ) : (
            entity.attributes.map(attr => (
              <div 
                key={attr.id} 
                className="text-xs py-1 flex justify-between items-center hover:bg-gray-50 group"
              >
                {editingAttribute === attr.id ? (
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleUpdateAttribute(attr.id, { name: e.target.value })}
                      className="w-full text-xs px-1 border rounded"
                    />
                    <div className="flex space-x-1">
                      <select
                        value={attr.visibility}
                        onChange={(e) => handleUpdateAttribute(attr.id, { visibility: e.target.value as Visibility })}
                        className="text-xs px-1 border rounded flex-1"
                      >
                        {VISIBILITIES.map(vis => (
                          <option key={vis} value={vis}>{vis}</option>
                        ))}
                      </select>
                      <select
                        value={attr.type}
                        onChange={(e) => handleUpdateAttribute(attr.id, { type: e.target.value as DataType })}
                        className="text-xs px-1 border rounded flex-1"
                      >
                        {DATA_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <span 
                      className="flex-1 cursor-pointer"
                      onDoubleClick={() => setEditingAttribute(attr.id)}
                    >
                      <span className="font-mono">{getVisibilitySymbol(attr.visibility)}</span>
                      <span className={attr.isKey ? 'font-bold underline text-blue-700' : 'text-blue-700 font-semibold'}>{attr.name}</span>
                      <span className="text-gray-700">: {attr.type}</span>
                      {attr.isKey && <span className="text-yellow-600 ml-1">🔑</span>}
                    </span>
                    <button
                      onClick={() => handleRemoveAttribute(attr.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 ml-2"
                      title="Remove attribute"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Methods Section */}
      <div>
        <div className="px-3 py-1 bg-gray-50 text-xs font-semibold text-gray-700 flex justify-between items-center">
          <span>Methods</span>
          <button
            onClick={() => setShowAddMethod(!showAddMethod)}
            className="text-blue-600 hover:text-blue-800 text-lg font-bold"
            title="Add method"
          >
            +
          </button>
        </div>

        {/* Add new method form */}
        {showAddMethod && (
          <div className="px-3 py-2 bg-green-50 border-b border-green-200">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Method name"
                value={newMethod.name}
                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                className="w-full text-xs px-2 py-1 border rounded"
              />
              <div className="flex space-x-1">
                <select
                  value={newMethod.visibility}
                  onChange={(e) => setNewMethod({ ...newMethod, visibility: e.target.value as Visibility })}
                  className="text-xs px-1 py-1 border rounded flex-1"
                >
                  {VISIBILITIES.map(vis => (
                    <option key={vis} value={vis}>{vis}</option>
                  ))}
                </select>
                <select
                  value={newMethod.returnType}
                  onChange={(e) => setNewMethod({ ...newMethod, returnType: e.target.value as DataType | 'void' })}
                  className="text-xs px-1 py-1 border rounded flex-2"
                >
                  <option value="void">void</option>
                  {DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={handleAddMethod}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddMethod(false)}
                  className="text-xs px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Methods list */}
        <div className="px-3 py-2 max-h-24 overflow-y-auto">
          {(!entity.methods || entity.methods.length === 0) ? (
            <div className="text-gray-400 italic text-xs">No methods</div>
          ) : (
            entity.methods.map(method => (
              <div key={method.id} className="text-xs py-1 hover:bg-gray-50">
                <span className="font-mono">{getVisibilitySymbol(method.visibility)}</span>
                <span>{method.name}()</span>
                <span className="text-green-600">: {method.returnType}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UMLClassNode;
