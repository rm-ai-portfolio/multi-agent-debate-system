import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

interface AgentNodeData {
  label: string
  color: string
}

export const AgentNode = memo(function AgentNode({ data }: NodeProps<AgentNodeData>) {
  return (
    <div
      className="px-4 py-3 rounded-lg border-2 bg-gray-800 shadow-lg min-w-[120px] text-center"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />
      <div className="text-sm font-medium text-white">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
    </div>
  )
})
