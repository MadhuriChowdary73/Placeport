'use client'

import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Round {
  id: string
  round_types: { name: string }
  order_index: number
  questions?: string
  difficulty?: number
  duration_min?: number
  tips?: string
}

const ROUND_COLORS: Record<string, string> = {
  OA:          'bg-blue-100 text-blue-800 border-blue-200',
  Coding:      'bg-purple-100 text-purple-800 border-purple-200',
  Technical:   'bg-green-100 text-green-800 border-green-200',
  HR:          'bg-pink-100 text-pink-800 border-pink-200',
  Managerial:  'bg-orange-100 text-orange-800 border-orange-200',
  Aptitude:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  GD:          'bg-teal-100 text-teal-800 border-teal-200',
  'Case Study':'bg-rose-100 text-rose-800 border-rose-200',
  Custom:      'bg-gray-100 text-gray-700 border-gray-200',
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className={cn(
            'w-2 h-2 rounded-full',
            i <= level ? 'bg-[#A41D35]' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  )
}

export function RoundTimeline({ rounds }: { rounds: Round[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const sorted = [...rounds].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-0">
      {sorted.map((round, index) => {
        const name = round.round_types.name
        const colorClass = ROUND_COLORS[name] ?? ROUND_COLORS.Custom
        const isExpanded = expanded === round.id

        return (
          <div key={round.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                colorClass
              )}>
                {index + 1}
              </div>
              {index < sorted.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[1.5rem]" />
              )}
            </div>

            {/* Round content */}
            <div className="flex-1 pb-4">
              <button
                onClick={() => setExpanded(isExpanded ? null : round.id)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-md border', colorClass)}>
                      {name}
                    </span>
                    {round.duration_min && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {round.duration_min}m
                      </span>
                    )}
                    {round.difficulty && <DifficultyDots level={round.difficulty} />}
                  </div>
                  {(round.questions || round.tips) && (
                    isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-3 pl-1">
                  {round.questions && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Questions asked</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{round.questions}</p>
                    </div>
                  )}
                  {round.tips && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tips</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{round.tips}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
