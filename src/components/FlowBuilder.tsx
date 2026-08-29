import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  type Connection,
  type Edge,
  type Node,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useDebateStore } from '../store/useDebateStore'
import { AgentNode } from './AgentNode'
import { EdgeConfigModal } from './EdgeConfigModal'

const nodeTypes = { agent: AgentNode }

export function FlowBuilder() {
  const agents = useDebateStore((s) => s.agents)
  const storeFlow = useDebateStore((s) => s.flow)
  const updateFlow = useDebateStore((s) => s.setFlow)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const prevAgentIdsRef = useRef<string>('')
  const prevFlowIdsRef = useRef<string>('')

  // Sync nodes and edges when store agents/flow change (e.g. from AI Generate)
  useEffect(() => {
    const agentIds = agents.map((a) => a.id).join(',')
    const flowIds = storeFlow.map((f) => f.id).join(',')

    const agentsChanged = agentIds !== prevAgentIdsRef.current
    const flowChanged = flowIds !== prevFlowIdsRef.current

    if (!agentsChanged && !flowChanged) {
      // Only update labels/colors for existing nodes
      setNodes((nds) =>
        nds.map((n) => {
          const agent = agents.find((a) => a.id === n.id)
          if (agent) return { ...n, data: { label: agent.name, color: agent.color } }
          return n
        })
      )
      return
    }

    prevAgentIdsRef.current = agentIds
    prevFlowIdsRef.current = flowIds

    // Rebuild nodes
    const newNodes: Node[] = agents.map((agent, i) => {
      const angle = (2 * Math.PI * i) / agents.length
      const radius = agents.length <= 2 ? 150 : 180
      return {
        id: agent.id,
        type: 'agent',
        position: {
          x: 300 + radius * Math.cos(angle - Math.PI / 2),
          y: 200 + radius * Math.sin(angle - Math.PI / 2),
        },
        data: { label: agent.name, color: agent.color },
      }
    })
    setNodes(newNodes)

    // Rebuild edges from store flow
    const newEdges: Edge[] = storeFlow.map((f) => ({
      id: f.id,
      source: f.source,
      target: f.target,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
      label: `${f.turns} turns`,
      style: { stroke: '#6b7280' },
      data: { turns: f.turns },
    }))
    setEdges(newEdges)
  }, [agents, storeFlow, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        label: '3 turns',
        style: { stroke: '#6b7280' },
        data: { turns: 3 },
      } as Edge
      setEdges((eds) => addEdge(newEdge, eds))

      const flowEdge = {
        id: newEdge.id,
        source: connection.source!,
        target: connection.target!,
        turns: 3,
      }
      updateFlow([...useDebateStore.getState().flow, flowEdge])
      prevFlowIdsRef.current = [...useDebateStore.getState().flow, flowEdge].map((f) => f.id).join(',')
    },
    [setEdges, updateFlow]
  )

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge)
  }, [])

  const handleEdgeTurnsChange = useCallback(
    (edgeId: string, turns: number) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? { ...e, label: `${turns} turns`, data: { ...e.data, turns } } : e
        )
      )
      useDebateStore.getState().updateEdgeTurns(edgeId, turns)
      setSelectedEdge(null)
    },
    [setEdges]
  )

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-950"
      >
        <Background color="#374151" gap={20} />
        <Controls className="!bg-gray-800 !border-gray-700 [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-white" />
      </ReactFlow>

      <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg px-4 py-2 text-xs text-gray-400 border border-gray-700">
        Connect agents by dragging from one handle to another. Click an edge to set turns.
      </div>

      {selectedEdge && (
        <EdgeConfigModal
          edge={selectedEdge}
          onSave={handleEdgeTurnsChange}
          onClose={() => setSelectedEdge(null)}
        />
      )}
    </div>
  )
}
