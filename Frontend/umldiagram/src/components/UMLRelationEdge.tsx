"use client";
import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from 'reactflow';
import type { UMLRelation, RelationType } from '../types/uml';

interface UMLRelationEdgeData {
  relation: UMLRelation;
  onUpdateRelation?: (updatedRelation: UMLRelation) => void;
}

type UMLRelationEdgeProps = EdgeProps<UMLRelationEdgeData>;

const UMLRelationEdge: React.FC<UMLRelationEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const { relation } = data || { relation: null };
  
  if (!relation) return null;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getStrokeStyle = (type: RelationType): string => {
    switch (type) {
      case 'dependency':
        return '5,5'; // Línea punteada
      default:
        return 'none'; // Línea sólida
    }
  };

  const getStrokeWidth = (selected: boolean): number => {
    return selected ? 3 : 2;
  };

  const getMarkerEnd = (type: RelationType): string => {
    switch (type) {
      case 'inheritance':
        return 'url(#inheritance-marker)';
      case 'implementation':
        return 'url(#implementation-marker)';
      case 'composition':
        return 'url(#composition-marker)';
      case 'aggregation':
        return 'url(#aggregation-marker)';
      case 'dependency':
        return 'url(#dependency-marker)';
      case 'association':
      default:
        return 'url(#association-marker)';
    }
  };

  const getRelationLabel = (type: RelationType): string => {
    switch (type) {
      case 'inheritance': return 'extends';
      case 'implementation': return 'implements';
      case 'composition': return 'composed of';
      case 'aggregation': return 'aggregates';
      case 'dependency': return 'depends on';
      case 'association': return 'associated with';
      default: return '';
    }
  };

  return (
    <>
      {/* SVG defs for markers - should be in a global SVG defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Marcador de herencia (flecha hueca) */}
          <marker
            id="inheritance-marker"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill="white"
              stroke="black"
              strokeWidth="1"
            />
          </marker>

          {/* Marcador de implementación (flecha hueca punteada) */}
          <marker
            id="implementation-marker"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill="white"
              stroke="black"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </marker>

          {/* Marcador de composición (diamante lleno) */}
          <marker
            id="composition-marker"
            markerWidth="12"
            markerHeight="8"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,3 L3,0 L9,3 L3,6 z"
              fill="black"
              stroke="black"
              strokeWidth="1"
            />
          </marker>

          {/* Marcador de agregación (diamante hueco) */}
          <marker
            id="aggregation-marker"
            markerWidth="12"
            markerHeight="8"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,3 L3,0 L9,3 L3,6 z"
              fill="white"
              stroke="black"
              strokeWidth="1"
            />
          </marker>

          {/* Marcador de dependencia (flecha simple) */}
          <marker
            id="dependency-marker"
            markerWidth="10"
            markerHeight="10"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L7,3 z"
              fill="black"
              stroke="black"
              strokeWidth="1"
            />
          </marker>

          {/* Marcador de asociación (flecha simple) */}
          <marker
            id="association-marker"
            markerWidth="10"
            markerHeight="10"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L7,3 z"
              fill="black"
              stroke="black"
              strokeWidth="1"
            />
          </marker>
        </defs>
      </svg>

      <BaseEdge
        path={edgePath}
        markerEnd={getMarkerEnd(relation.type)}
        style={{
          strokeWidth: getStrokeWidth(selected || false),
          stroke: selected ? '#3b82f6' : '#374151',
          strokeDasharray: getStrokeStyle(relation.type),
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Etiqueta de la relación */}
          {relation.label && (
            <div className="bg-white px-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 mb-1 text-center">
              {relation.label}
            </div>
          )}

          {/* Cardinalidades */}
          <div className="flex justify-between items-center min-w-[80px]">
            {/* Cardinalidad origen */}
            <div className="bg-yellow-100 px-1 border border-yellow-300 rounded text-xs font-bold text-gray-800">
              {relation.sourceCardinality.label}
            </div>

            {/* Tipo de relación */}
            <div className="bg-blue-100 px-1 border border-blue-300 rounded text-xs text-blue-800 mx-1">
              {getRelationLabel(relation.type)}
            </div>

            {/* Cardinalidad destino */}
            <div className="bg-yellow-100 px-1 border border-yellow-300 rounded text-xs font-bold text-gray-800">
              {relation.targetCardinality.label}
            </div>
          </div>

          {/* Roles */}
          {(relation.sourceRole || relation.targetRole) && (
            <div className="flex justify-between items-center min-w-[80px] mt-1">
              <div className="text-xs text-gray-600 italic">
                {relation.sourceRole || ''}
              </div>
              <div className="text-xs text-gray-600 italic">
                {relation.targetRole || ''}
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default UMLRelationEdge;