'use client'

import { useState, useEffect } from 'react'
import { RoundList } from '@/components/experience/RoundList'
import { RoundEditor, type RoundWithId } from '@/components/experience/RoundEditor'

interface FlowBuilderProps {
  rounds: RoundWithId[]
  roundTypes: Array<{ id: string; name: string }>
  onChange: (rounds: RoundWithId[]) => void
}

export function FlowBuilder({ rounds, roundTypes, onChange }: FlowBuilderProps) {
  const [activeRoundId, setActiveRoundId] = useState<string | null>(() => {
    return rounds.length > 0 ? rounds[0]._tempId : null
  })

  // Ensure activeRoundId stays pointing to a valid round if rounds change from outside
  useEffect(() => {
    if (rounds.length > 0) {
      if (!activeRoundId || !rounds.some(r => r._tempId === activeRoundId)) {
        setActiveRoundId(rounds[0]._tempId)
      }
    } else {
      setActiveRoundId(null)
    }
  }, [rounds, activeRoundId])

  const activeRound = rounds.find(r => r._tempId === activeRoundId) || null

  function handleAddRound() {
    const tempId = crypto.randomUUID()
    const defaultRoundType = roundTypes[0]
    const newRound: RoundWithId = {
      _tempId: tempId,
      round_type_id: defaultRoundType?.id ?? 'rt1',
      round_type_name: defaultRoundType?.name ?? 'Interview Round',
      order_index: rounds.length,
      questions: '',
      tips: '',
      difficulty: 3,
      duration_min: 45,
    }

    const updated = [...rounds, newRound]
    onChange(updated)
    setActiveRoundId(tempId) // Immediately activate newly created round
  }

  function handleRemoveRound(tempIdToRemove: string) {
    const removeIdx = rounds.findIndex(r => r._tempId === tempIdToRemove)
    const updated = rounds
      .filter(r => r._tempId !== tempIdToRemove)
      .map((r, i) => ({ ...r, order_index: i }))

    onChange(updated)

    // Set active round to nearest remaining one
    if (activeRoundId === tempIdToRemove) {
      if (updated.length === 0) {
        setActiveRoundId(null)
      } else {
        const nextIdx = Math.min(removeIdx, updated.length - 1)
        setActiveRoundId(updated[nextIdx]._tempId)
      }
    }
  }

  function handleUpdateActiveRound(field: string, value: unknown) {
    if (!activeRoundId) return
    const updated = rounds.map(r => {
      if (r._tempId === activeRoundId) {
        return { ...r, [field]: value }
      }
      return r
    })
    onChange(updated)
  }

  function handleReorderRounds(reordered: RoundWithId[]) {
    onChange(reordered)
  }

  return (
    <div className="space-y-4">
      <RoundList
        rounds={rounds}
        roundTypes={roundTypes}
        activeRoundId={activeRoundId}
        onSelectRound={(id) => setActiveRoundId(id)}
        onAddRound={handleAddRound}
        onRemoveRound={handleRemoveRound}
        onReorderRounds={handleReorderRounds}
      />

      {activeRound && (
        <RoundEditor
          key={activeRound._tempId}
          round={activeRound}
          roundTypes={roundTypes}
          onChange={handleUpdateActiveRound}
        />
      )}
    </div>
  )
}
export { RoundList } from '@/components/experience/RoundList'
export { RoundEditor } from '@/components/experience/RoundEditor'
export type { RoundWithId } from '@/components/experience/RoundEditor'
