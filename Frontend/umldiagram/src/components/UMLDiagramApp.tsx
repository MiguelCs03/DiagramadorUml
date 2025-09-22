"use client";

import React, { useState, useCallback, useEffect } from 'react';
import DiagramEditor from './DiagramEditor';
import Sidebar from './Sidebar';
<<<<<<< HEAD
import AIChatBot from './AIChatBot';
=======
>>>>>>> 327cc17 (corrigiendo errores)
import type { 
  UMLDiagram, 
  UMLEntity, 
  UMLRelation, 
  EntityType, 
  RelationType
} from '../types/uml';
import { CardinalityUtils } from '../types/uml';
<<<<<<< HEAD
import { exportAsZip, exportDiagramAsJson } from '../utils/projectExporter';
=======
>>>>>>> 327cc17 (corrigiendo errores)

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

<<<<<<< HEAD
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
=======
  // Exportar diagrama
  const handleExportDiagram = useCallback(() => {
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.name || 'uml-diagram'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
>>>>>>> 327cc17 (corrigiendo errores)
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

  return (
    <div className="h-screen w-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onCreateEntity={handleCreateEntity}
        onCreateRelation={handleCreateRelation}
        onGenerateCode={handleGenerateCode}
        onExportDiagram={handleExportDiagram}
        onImportDiagram={handleImportDiagram}
      />

      {/* Main diagram area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{diagram.name}</h1>
              <p className="text-sm text-gray-500">
                Last modified: {isClient ? diagram.metadata?.modified.toLocaleString() : 'Loading...'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExportDiagram}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
<<<<<<< HEAD
                title="Export diagram as JSON"
              >
                📄 Export JSON
              </button>
              <button
                onClick={handleExportSpringBoot}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                title="Generate and download Spring Boot project"
              >
                ☕ Export Spring Boot
=======
              >
                Export
>>>>>>> 327cc17 (corrigiendo errores)
              </button>
              <button
                onClick={handleImportDiagram}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Import
              </button>
              <button
                onClick={handleGenerateCode}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
              >
                🚀 Generate Code
              </button>
            </div>
          </div>
        </header>

        {/* Diagram editor */}
        <div className="flex-1">
          <DiagramEditor
            diagram={diagram}
            onUpdateDiagram={handleUpdateDiagram}
            selectedTool={selectedTool}
            onClearTool={handleClearTool}
          />
        </div>
      </div>
<<<<<<< HEAD

      {/* AI ChatBot */}
      <AIChatBot
        onDiagramGenerated={handleAIGeneratedDiagram}
        currentDiagram={diagram}
      />
=======
>>>>>>> 327cc17 (corrigiendo errores)
    </div>
  );
};

export default UMLDiagramApp;