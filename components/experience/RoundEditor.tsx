'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RoundInput } from '@/lib/validations/post'

export interface RoundWithId extends RoundInput {
  _tempId: string
  round_type_name?: string
}

interface RoundEditorProps {
  round: RoundWithId
  roundTypes: Array<{ id: string; name: string }>
  onChange: (field: string, value: unknown) => void
}

export function RoundEditor({ round, roundTypes, onChange }: RoundEditorProps) {
  return (
    <div className="border border-[#E8E2D9] rounded-2xl bg-white p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <h4 className="font-bold text-gray-900 text-base">
          Editing Round: <span className="text-[#A41D35]">{round.round_type_name || 'Interview Round'}</span>
        </h4>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          Order #{(round.order_index ?? 0) + 1}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2 space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Round Type *</Label>
          <Select
            value={round.round_type_id || ''}
            onValueChange={(val) => {
              const rt = roundTypes.find(r => r.id === val)
              onChange('round_type_id', val)
              onChange('round_type_name', rt?.name ?? '')
            }}
          >
            <SelectTrigger className="text-base py-2 bg-white">
              <SelectValue placeholder="Select round type" />
            </SelectTrigger>
            <SelectContent>
              {roundTypes.map(rt => (
                <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Questions Asked / Key Topics</Label>
          <Textarea
            rows={3}
            placeholder="What were the questions? Be as specific as you can..."
            value={typeof round.questions === 'string' ? round.questions : Array.isArray(round.questions) ? round.questions.join('\n') : ''}
            onChange={e => onChange('questions', e.target.value)}
            className="text-base resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Difficulty (1 to 5)</Label>
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="e.g. 3"
            value={round.difficulty ?? ''}
            onChange={e => onChange('difficulty', parseInt(e.target.value) || undefined)}
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Duration (minutes)</Label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 45"
            value={round.duration_min ?? round.duration_minutes ?? ''}
            onChange={e => {
              const val = parseInt(e.target.value) || undefined
              onChange('duration_min', val)
              onChange('duration_minutes', val)
            }}
            className="text-base"
          />
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Platform (optional)</Label>
          <Input
            placeholder="e.g. HackerRank, MS Teams, In-Person CIR"
            value={round.platform ?? ''}
            onChange={e => onChange('platform', e.target.value)}
            className="text-base"
          />
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Tips for this Round</Label>
          <Textarea
            rows={2}
            placeholder="What should juniors focus on or do differently in this round?"
            value={round.tips ?? ''}
            onChange={e => onChange('tips', e.target.value)}
            className="text-base resize-none"
          />
        </div>
      </div>
    </div>
  )
}
