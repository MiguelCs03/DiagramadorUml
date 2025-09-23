"use client";

import React, { useState, useCallback, useEffect } from 'react';
import DiagramEditor from './DiagramEditor';
import Sidebar from './Sidebar';
import AIChatBot from './AIChatBot';
import type {
  UMLDiagram, 
  UMLEntity, 
  UMLRelation, 
  EntityType, 
  RelationType
} from '../types/uml';
import { CardinalityUtils } from '../types/uml';
import { exportAsZip, exportDiagramAsJson } from '../utils/projectExporter';

// Componente principal que maneja el estado del diagrama
const UMLDiagramApp: React.FC = () => {
  // Estado para controlar si estamos en el cliente (para evitar errores de hidratación)
  const [isClient, setIsClient] = useState(false);

  // Estado del diagrama
  const [diagram, setDiagram] = useState<UMLDiagram>({
    id: 'diagram-1',
    name: 'New UML Diagram',
    entities: [],
    relations: [],
    packages: [],
    metadata: {
      created: new Date(),
      modified: new Date(),
      version: '1.0.0'
    }
  });

  // Herramienta seleccionada en la sidebar
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Estado para controlar el panel lateral activo
  const [activePanel, setActivePanel] = useState<'ai' | 'voice' | null>('ai');

  // useEffect para detectar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Manejar actualización del diagrama
  const handleUpdateDiagram = useCallback((updatedDiagram: UMLDiagram) => {
    setDiagram({
      ...updatedDiagram,
      metadata: {
        ...updatedDiagram.metadata,
        created: updatedDiagram.metadata?.created || new Date(),
        version: updatedDiagram.metadata?.version || '1.0.0',
        modified: new Date()
      }
    });
  }, []);

  // Crear una nueva entidad
  const handleCreateEntity = useCallback((type: EntityType) => {
    const newEntity: UMLEntity = {
      id: `entity-${Date.now()}`,
      name: `New${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      attributes: [],
      methods: []
    };

    const updatedDiagram: UMLDiagram = {
      ...diagram,
      entities: [...diagram.entities, newEntity],
      metadata: {
        ...diagram.metadata,
        created: diagram.metadata?.created || new Date(),
        version: diagram.metadata?.version || '1.0.0',
        modified: new Date()
      }
    };

    setDiagram(updatedDiagram);
  }, [diagram]);

  // Crear una nueva relación
  const handleCreateRelation = useCallback((type: RelationType) => {
    // Esta función se activa cuando se selecciona un tipo de relación
    // La creación real se maneja en el DiagramEditor cuando se conectan nodos
    console.log(`Selected relation type: ${type}`);
  }, []);

  // Generar código Spring Boot
  const handleGenerateCode = useCallback(() => {
    console.log('Generating Spring Boot code...', diagram);
    
    // Crear estructura de archivos para el backend
    const entities = diagram.entities.filter(e => !e.isGenerated);
    const intermediateEntities = diagram.entities.filter(e => e.isGenerated);
    
    const codeStructure = {
      entities: entities.map(entity => ({
        name: entity.name,
        className: `${entity.name}.java`,
        attributes: entity.attributes,
        methods: entity.methods || [],
        type: entity.type
      })),
      intermediateEntities: intermediateEntities.map(entity => ({
        name: entity.name,
        className: `${entity.name}.java`,
        attributes: entity.attributes,
        generatedFrom: entity.generatedFrom
      })),
      relations: diagram.relations.map(relation => ({
        id: relation.id,
        source: relation.source,
        target: relation.target,
        type: relation.type,
        sourceCardinality: relation.sourceCardinality.label,
        targetCardinality: relation.targetCardinality.label,
        isManyToMany: CardinalityUtils.isManyToMany(relation),
        isOneToMany: CardinalityUtils.isOneToMany(relation),
        isOneToOne: CardinalityUtils.isOneToOne(relation)
      }))
    };

    console.log('Code structure:', codeStructure);
    
    // Aquí se implementaría la generación real del código
    alert(`Generating code for:\n- ${entities.length} entities\n- ${intermediateEntities.length} intermediate tables\n- ${diagram.relations.length} relations\n\nCode generation will be implemented in the backend integration.`);
  }, [diagram]);

  // Manejar diagrama generado por IA
  const handleAIGeneratedDiagram = useCallback((newDiagram: UMLDiagram) => {
    setDiagram({
      ...newDiagram,
      metadata: {
        created: newDiagram.metadata?.created || new Date(),
        modified: new Date(),
        version: newDiagram.metadata?.version || '1.0.0',
        author: newDiagram.metadata?.author
      }
    });
  }, []);

  // Exportar diagrama como JSON
  const handleExportDiagram = useCallback(() => {
    exportDiagramAsJson(diagram);
  }, [diagram]);

  // Exportar proyecto Spring Boot
  const handleExportSpringBoot = useCallback(async () => {
    try {
      const projectName = prompt('Nombre del proyecto:', diagram.name.replace(/\s+/g, '-').toLowerCase()) || 'uml-generated-project';
      const packageName = prompt('Nombre del paquete:', 'com.example.demo') || 'com.example.demo';
      await exportAsZip(diagram, projectName, packageName);
    } catch (error) {
      console.error('Error exporting Spring Boot project:', error);
      alert('Error al exportar el proyecto Spring Boot. Verifica que jszip esté instalado.');
    }
  }, [diagram]);

  // Importar diagrama
  const handleImportDiagram = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedDiagram = JSON.parse(e.target?.result as string);
            setDiagram({
              ...importedDiagram,
              metadata: {
                ...importedDiagram.metadata,
                modified: new Date()
              }
            });
            alert('Diagram imported successfully!');
          } catch (error) {
            alert('Error importing diagram. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  // Limpiar herramienta seleccionada
  const handleClearTool = useCallback(() => {
    setSelectedTool(null);
  }, []);

  // Si no estamos en el cliente, no renderizamos nada para evitar problemas de hidratación
  if (!isClient) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar izquierda */}
      <Sidebar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onCreateEntity={handleCreateEntity}
        onCreateRelation={handleCreateRelation}
        onGenerateCode={handleGenerateCode}
        onExportDiagram={handleExportDiagram}
        onImportDiagram={handleImportDiagram}
      />

      {/* Editor central */}
      <div className="flex-1 flex">
        <DiagramEditor
          diagram={diagram}
          onUpdateDiagram={handleUpdateDiagram}
          selectedTool={selectedTool}
          onClearTool={handleClearTool}
        />
      </div>

      {/* Panel derecho con pestañas para IA y Voz */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Pestañas */}
        <div className="flex border-b">
          <button
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activePanel === 'ai' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            💬 Chat IA
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'voice' ? null : 'voice')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activePanel === 'voice' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎤 Voz
          </button>
        </div>

        {/* Contenido del panel activo */}
        <div className="flex-1 min-h-0">
          {activePanel === 'ai' && (
            <AIChatBot
              onDiagramGenerated={handleAIGeneratedDiagram}
              currentDiagram={diagram}
            />
          )}
          {activePanel === 'voice' && (
            <div className="p-4 text-center text-gray-500">
              🎤 Voice functionality coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UMLDiagramApp;