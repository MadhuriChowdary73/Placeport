// PostFilters.tsx — branch filter only
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const BRANCH_OPTIONS = [
  { value: 'all', label: 'All branches' },
  { value: 'CSE', label: 'CSE' },
  { value: 'AIE', label: 'AIE' },
  { value: 'CCE', label: 'CCE' },
]

export function PostFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateBranch(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('branch', value)
    } else {
      params.delete('branch')
    }
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function handleClear() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('branch')
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const currentBranch = searchParams.get('branch') ?? 'all'

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-gray-800">Filter Experiences</h3>
        <button
          type="button"
          onClick={handleClear}
          className="text-[14px] font-semibold text-gray-400 hover:text-[#A41D35] transition"
        >
          Clear all
        </button>
      </div>

      <div className="max-w-xs">
        <Select value={currentBranch} onValueChange={(v: any) => updateBranch(v ?? 'all')}>
          <SelectTrigger className="text-[15px]">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            {BRANCH_OPTIONS.map(b => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
