"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

interface ProcessNodeData {
  label: string;
  nodeType: "start" | "activity" | "end";
}

const ProcessNode = memo(({ data }: NodeProps<ProcessNodeData>) => {
  const { label, nodeType } = data;

  const getNodeStyles = () => {
    if (nodeType === "start") {
      return {
        container: "bg-gradient-to-br from-brand to-brand/80 text-white shadow-xl shadow-brand/30 border-2 border-brand",
        handle: "!bg-white !border-brand",
      };
    } else if (nodeType === "end") {
      return {
        container: "bg-gradient-to-br from-destructive to-destructive/80 text-white shadow-xl shadow-destructive/30 border-2 border-destructive",
        handle: "!bg-white !border-destructive",
      };
    } else {
      return {
        container: "bg-card text-foreground shadow-lg border-2 border-brand/20 hover:border-brand/40",
        handle: "!bg-brand !border-brand",
      };
    }
  };

  const styles = getNodeStyles();

  return (
    <div className={cn(
      "px-6 py-4 rounded-xl min-w-[180px] text-center font-semibold text-sm transition-all duration-300 hover:scale-105",
      styles.container
    )}>
      <Handle
        type="target"
        position={Position.Left}
        className={cn("!w-3 !h-3 !border-2", styles.handle)}
      />
      
      <div className="whitespace-nowrap">{label}</div>
      
      <Handle
        type="source"
        position={Position.Right}
        className={cn("!w-3 !h-3 !border-2", styles.handle)}
      />
    </div>
  );
});

ProcessNode.displayName = "ProcessNode";

export default ProcessNode;
