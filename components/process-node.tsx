"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

interface ProcessNodeData {
  label: string;
  nodeType: "start" | "activity" | "end";
}

const ProcessNode = memo(({ data }: NodeProps<ProcessNodeData>) => {
  const { label, nodeType } = data;

  let bgGradient = "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"; // cyan gradient for start
  if (nodeType === "end") {
    bgGradient = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"; // red gradient for end
  } else if (nodeType === "activity") {
    bgGradient = "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"; // brand cyan gradient for process
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      
      <div
        style={{
          background: bgGradient,
          padding: '10px 20px',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '600',
          fontSize: '14px',
          minWidth: '150px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        {label}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </>
  );
});

ProcessNode.displayName = "ProcessNode";

export default ProcessNode;
