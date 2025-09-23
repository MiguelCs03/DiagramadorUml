import React, { useState, useRef, useEffect } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { AIService, type VoiceCommandRequest, type VoiceCommandResponse } from '../services/aiService';
import type { UMLDiagram } from '../types/uml';

interface VoiceChatProps {
  currentDiagram?: UMLDiagram;
  onDiagramUpdate?: (diagram: UMLDiagram) => void;
  className?: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  action?: 'create' | 'modify' | 'delete' | 'explain';
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  currentDiagram,
  onDiagramUpdate,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    error: voiceError
  } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onError: (error) => console.error('Voice error:', error)
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleVoiceResult(command: string) {
    if (!command.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: command,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const request: VoiceCommandRequest = {
        command,
        currentDiagram,
        context: currentDiagram ? `Diagrama: ${currentDiagram.name}` : undefined
      };

      const response: VoiceCommandResponse = await AIService.processVoiceCommand(request);

      if (response.success) {
        // Agregar respuesta de la IA
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: response.message || 'Comando procesado correctamente',
          timestamp: new Date(),
          action: response.action
        };

        setMessages(prev => [...prev, aiMessage]);

        // Actualizar diagrama si hay cambios
        if (response.updatedDiagram && onDiagramUpdate) {
          onDiagramUpdate(response.updatedDiagram);
        }
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: 'ai',
          content: `Error: ${response.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'Error al procesar el comando',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'modify': return '✏️';
      case 'delete': return '🗑️';
      case 'explain': return '💡';
      default: return '🤖';
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-700">
          ❌ Tu navegador no soporta reconocimiento de voz
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">
          🎤 Chat por Voz
        </h3>
        <button
          onClick={clearMessages}
          className="text-sm text-gray-500 hover:text-gray-700"
          disabled={isProcessing}
        >
          Limpiar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">💬 Inicia una conversación</p>
            <p className="text-sm">
              Ejemplos: "Agrega la clase Usuario", "Elimina la tabla Producto"
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-1 mb-1">
                    <span>{getActionIcon(message.action)}</span>
                    <span className="text-xs font-medium">IA</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">Procesando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Controls */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {transcript && (
              <p className="text-sm text-gray-600 mb-2">
                🎙️ "{transcript}"
              </p>
            )}
            {voiceError && (
              <p className="text-sm text-red-600 mb-2">
                ⚠️ {voiceError}
              </p>
            )}
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? '⏹️ Detener' : '🎤 Hablar'}
          </button>
        </div>

        {currentDiagram && (
          <div className="mt-2 text-xs text-gray-500">
            📊 Diagrama actual: {currentDiagram.name}
            ({currentDiagram.entities.length} entidades)
          </div>
        )}
      </div>
    </div>
  );
};
