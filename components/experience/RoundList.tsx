'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import type { RoundWithId } from './RoundEditor'

interface SortableRoundTabProps {
  round: RoundWithId
  roundTypes: Array<{ id: string; name: string }>
  isActive: boolean
  index: number
  onSelect: () => void
  onRemove: () => void
}

function SortableRoundTab({
  round,
  roundTypes,
  isActive,
  index,
  onSelect,
  onRemove,
}: SortableRoundTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: round._tempId,
  })

  const roundName =
    round.round_type_name ||
    roundTypes.find(rt => rt.id === round.round_type_id)?.name ||
    `Round ${index + 1}`

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition select-none ${
        isDragging ? 'shadow-lg opacity-75 z-50 ring-2 ring-[#A41D35]' : ''
      } ${
        isActive
          ? 'bg-[#FDF2F4] border-[#A41D35] text-[#A41D35] shadow-xs'
          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-600 touch-none"
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="truncate max-w-[140px]">{roundName}</span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="text-gray-300 hover:text-red-500 transition ml-1"
        title="Remove round"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

interface RoundListProps {
  rounds: RoundWithId[]
  roundTypes: Array<{ id: string; name: string }>
  activeRoundId: string | null
  onSelectRound: (id: string) => void
  onAddRound: () => void
  onRemoveRound: (id: string) => void
  onReorderRounds: (rounds: RoundWithId[]) => void
}

export function RoundList({
  rounds,
  roundTypes,
  activeRoundId,
  onSelectRound,
  onAddRound,
  onRemoveRound,
  onReorderRounds,
}: RoundListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = rounds.findIndex(r => r._tempId === active.id)
      const newIndex = rounds.findIndex(r => r._tempId === over.id)
      const reordered = arrayMove(rounds, oldIndex, newIndex).map((r, i) => ({
        ...r,
        order_index: i,
      }))
      onReorderRounds(reordered)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={rounds.map(r => r._tempId)}
            strategy={horizontalListSortingStrategy}
          >
            {rounds.map((round, idx) => (
              <SortableRoundTab
                key={round._tempId}
                round={round}
                roundTypes={roundTypes}
                isActive={round._tempId === activeRoundId}
                index={idx}
                onSelect={() => onSelectRound(round._tempId)}
                onRemove={() => onRemoveRound(round._tempId)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={onAddRound}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[#A41D35]/40 text-[#A41D35] hover:bg-[#FDF2F4] text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Add round
        </button>
      </div>

      {rounds.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-8 text-center text-sm text-gray-500 bg-gray-50/50">
          No rounds added yet. Click &ldquo;Add round&rdquo; above to document your interview process.
        </div>
      )}
    </div>
  )
}
