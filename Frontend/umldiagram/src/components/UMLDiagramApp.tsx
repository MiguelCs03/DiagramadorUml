"use client";

import React, { useState, useCallback, useEffect } from 'react';
import DiagramEditor from './DiagramEditor';
import Sidebar from './Sidebar';
import AIChatBot from './AIChatBot';
import { VoiceChat } from './VoiceChat';
import { CollaborationPanel } from './CollaborationPanel';
import { useWebSocket } from '../hooks/useWebSocket';
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
  name: 'Nuevo Diagrama UML',
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
  const [activePanel, setActivePanel] = useState<'ai' | 'voice' | 'collab' | null>('ai');

  // Hook de WebSocket para colaboración
  const {
    roomState,
    sendDiagramUpdate,
    onDiagramUpdate,
    createRoom,
    joinRoom,
    leaveRoom
  } = useWebSocket();

  // useEffect para detectar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Configurar callback para recibir actualizaciones de colaboración
  useEffect(() => {
    console.log('[Colaboración] useEffect configurando onDiagramUpdate');
    onDiagramUpdate((receivedDiagram: UMLDiagram) => {
      console.log('[Colaboración][RX] Diagrama recibido por WebSocket:', receivedDiagram);
      setDiagram({
        ...receivedDiagram,
        metadata: {
          created: receivedDiagram.metadata?.created || new Date(),
          modified: new Date(),
          version: receivedDiagram.metadata?.version || '1.0.0',
          author: receivedDiagram.metadata?.author
        }
      });
    });
  }, [onDiagramUpdate]);

  // Manejar actualización del diagrama
  const handleUpdateDiagram = useCallback((updatedDiagram: UMLDiagram) => {
    const newDiagram = {
      ...updatedDiagram,
      metadata: {
        ...updatedDiagram.metadata,
        created: updatedDiagram.metadata?.created || new Date(),
        version: updatedDiagram.metadata?.version || '1.0.0',
        modified: new Date()
      }
    };
    
    setDiagram(newDiagram);
    
    // Enviar actualización a colaboradores si estamos en una sala
    if (roomState.roomCode) {
      console.log('[Colaboración][TX] Enviando actualización de diagrama a la sala', roomState.roomCode);
      sendDiagramUpdate(newDiagram);
    }
  }, [roomState.roomCode, sendDiagramUpdate]);

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
  alert(`Generando código para:\n- ${entities.length} entidades\n- ${intermediateEntities.length} tablas intermedias\n- ${diagram.relations.length} relaciones\n\nLa generación de código se implementará en la integración con el backend.`);
  }, [diagram]);

  // Manejar diagrama generado por IA
  const handleAIGeneratedDiagram = useCallback((newDiagram: UMLDiagram) => {
    const updatedDiagram = {
      ...newDiagram,
      metadata: {
        created: newDiagram.metadata?.created || new Date(),
        modified: new Date(),
        version: newDiagram.metadata?.version || '1.0.0',
        author: newDiagram.metadata?.author
      }
    };
    
    setDiagram(updatedDiagram);
    
    // Enviar actualización a colaboradores si estamos en una sala
    if (roomState.roomCode) {
      sendDiagramUpdate(updatedDiagram);
    }
  }, [roomState.roomCode, sendDiagramUpdate]);

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
            alert('¡Diagrama importado exitosamente!');
          } catch (error) {
            alert('Error al importar el diagrama. Verifica el formato del archivo.');
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
      <div className="flex-1 flex flex-col">
        <DiagramEditor
          diagram={diagram}
          onUpdateDiagram={handleUpdateDiagram}
          selectedTool={selectedTool}
          onClearTool={handleClearTool}
        />
        {/* Botón principal para exportar backend Spring Boot */}
        <div className="p-4 flex justify-center border-t bg-gray-50">
          <button
            onClick={handleExportSpringBoot}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            🚀 Exportar Backend Spring Boot
          </button>
        </div>
      </div>

      {/* Panel derecho con pestañas para IA, Voz y Colaboración */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Pestañas */}
        <div className="flex border-b">
          <button
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activePanel === 'ai' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            💬 IA
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'voice' ? null : 'voice')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activePanel === 'voice' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎤 Voz
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'collab' ? null : 'collab')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activePanel === 'collab' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            🤝 Sala
            {roomState.roomCode && (
              <span className="ml-1 px-1 bg-purple-600 text-white text-xs rounded">
                {roomState.clientCount}
              </span>
            )}
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
            <VoiceChat
              currentDiagram={diagram}
              onDiagramUpdate={handleAIGeneratedDiagram}
            />
          )}
          {activePanel === 'collab' && (
            <CollaborationPanel 
              roomState={roomState}
              createRoom={(d?: UMLDiagram) => {
                console.log('[Colaboración][UI] Crear sala solicitado');
                createRoom(d);
              }}
              joinRoom={(code: string) => {
                console.log('[Colaboración][UI] Unirse a sala solicitado:', code);
                joinRoom(code);
              }}
              leaveRoom={() => {
                console.log('[Colaboración][UI] Salir de sala solicitado');
                leaveRoom();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default UMLDiagramApp;