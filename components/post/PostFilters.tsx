// PostFilters.tsx — fixed null handling on URLSearchParams
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CAMPUSES, BRANCHES, OUTCOMES, OUTCOME_LABELS } from '@/lib/utils'

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

export function PostFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const val = (key: string): string => searchParams.get(key) ?? 'all'

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-gray-800">Filter Experiences</h3>
        <button
          onClick={() => router.push(pathname)}
          className="text-[14px] font-semibold text-gray-400 hover:text-[#A41D35] transition"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Company search */}
        <Input
          placeholder="Filter by company…"
          className="text-[15px] col-span-2 sm:col-span-1"
          defaultValue={searchParams.get('company') ?? ''}
          onChange={e => update('company', e.target.value)}
        />

        {/* Year */}
        <Select value={val('year')} onValueChange={(v: any) => update('year', v ?? 'all')}>
          <SelectTrigger className="text-[15px]"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Outcome */}
        <Select value={val('outcome')} onValueChange={(v: any) => update('outcome', v ?? 'all')}>
          <SelectTrigger className="text-[15px]"><SelectValue placeholder="Outcome" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            {OUTCOMES.map((o: string) => <SelectItem key={o} value={o}>{OUTCOME_LABELS[o]}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Campus */}
        <Select value={val('campus')} onValueChange={(v: any) => update('campus', v ?? 'all')}>
          <SelectTrigger className="text-[15px]"><SelectValue placeholder="Campus" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campuses</SelectItem>
            {CAMPUSES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Branch */}
        <Select value={val('branch')} onValueChange={(v: any) => update('branch', v ?? 'all')}>
          <SelectTrigger className="text-[15px]"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {BRANCHES.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={val('sort')} onValueChange={(v: any) => update('sort', v ?? 'recent')}>
          <SelectTrigger className="text-[15px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="helpful">Most helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
