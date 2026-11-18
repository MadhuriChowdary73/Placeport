'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { postSchema, type PostInput } from '@/lib/validations/post'
import { useCompanies, useRoundTypes } from '@/lib/hooks/usePosts'
import { FlowBuilder, type RoundWithId } from '@/components/post/FlowBuilder'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { CAMPUSES, BRANCHES, OUTCOMES, OUTCOME_LABELS } from '@/lib/utils'

const DISPLAY_MODES = [
  { value: 'full',   label: 'Full roll number (e.g. AV.SC.U4CSE24001)' },
  { value: 'masked', label: 'Masked roll number (e.g. AV.SC.U4CSE24XXX)' },
  { value: 'anon',   label: 'Anonymous handle' },
]

export default function NewPostPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [rounds, setRounds] = useState<RoundWithId[]>([])
  const [dos, setDos] = useState<string[]>([''])
  const [donts, setDonts] = useState<string[]>([''])
  const [resources, setResources] = useState<Array<{ url: string; note: string }>>([])

  const { data: companies = [] } = useCompanies()
  const { data: roundTypes = [] } = useRoundTypes()

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<PostInput>({
    resolver: zodResolver(postSchema) as any,
    defaultValues: {
      campus: 'Amaravati',
      year: new Date().getFullYear(),
      display_mode: 'masked',
      rounds: [],
      dos: [],
      donts: [],
      resources: [],
    },
  })

  function handleRoundsChange(newRounds: RoundWithId[]) {
    setRounds(newRounds)
    setValue('rounds', newRounds as any, { shouldValidate: true })
  }

  async function onSubmit(data: any) {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        rounds: rounds.map(({ _tempId, ...r }, idx) => ({
          ...r,
          order_index: idx + 1,
          round_type_id: r.round_type_id || (roundTypes[0]?.id ?? 'rt1'),
          questions: r.questions || '',
          tips: r.tips || '',
          difficulty: r.difficulty || 3,
          duration_min: r.duration_min || r.duration_minutes || 45,
          platform: r.platform || null,
        })),
        dos: dos.filter(d => d && d.trim()).map(d => ({ type: 'do', content: d.trim() })),
        donts: donts.filter(d => d && d.trim()).map(d => ({ type: 'dont', content: d.trim() })),
        resources: resources
          .filter(r => r.url && r.url.trim())
          .map(r => ({
            url: r.url.trim().startsWith('http') ? r.url.trim() : `https://${r.url.trim()}`,
            note: r.note?.trim() || ''
          })),
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        const errorMsg = errorData?.error?.message || errorData?.error || 'Failed to publish experience'
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
      }

      // Invalidate queries so feed immediately displays the new post
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      router.push('/feed')
    } catch (err: any) {
      alert(err.message || 'An error occurred while publishing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-10 shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Share your experience</h1>
          <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F4] text-[#A41D35] border border-[#F5D0D7]">
            Amaravati
          </span>
        </div>
        <p className="text-base text-gray-600 mt-1.5 font-normal">
          Help your juniors at Amrita Amaravati campus prepare. All fields marked with * are required.
        </p>
        <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-sm text-amber-900 font-medium">
          ⚠️ Please do not share confidential company-specific question papers or violate NDAs.
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, (valErrors) => {
          const firstErr = Object.values(valErrors)[0]?.message
          alert(firstErr || 'Please check all required fields.')
        })}
        className="space-y-8"
      >
        {/* Section 1: Company meta */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Company &amp; Role</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">Company Name *</Label>
              <Input
                {...register('company_name')}
                list="company-suggestions"
                placeholder="Type company (e.g. Cisco, Amazon, Zoho)"
                className={`text-base py-2.5 ${errors.company_name ? 'border-red-400' : ''}`}
              />
              <datalist id="company-suggestions">
                {companies.map((c: any) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {errors.company_name && <p className="text-xs text-red-500 font-medium">{errors.company_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">Role *</Label>
              <Input {...register('role')} placeholder="e.g. Software Engineer" className="text-base py-2.5" />
              {errors.role && <p className="text-xs text-red-500 font-medium">{errors.role.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">Year *</Label>
              <Input {...register('year', { valueAsNumber: true })} type="number" min={2015} max={2030} className="text-base py-2.5" />
              {errors.year && <p className="text-xs text-red-500 font-medium">{errors.year.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">Outcome *</Label>
              <Controller name="outcome" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="text-base py-2.5">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map(o => <SelectItem key={o} value={o}>{OUTCOME_LABELS[o]}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">Campus *</Label>
              <Controller name="campus" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="text-base py-2.5">
                    <SelectValue placeholder="Your campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">Branch *</Label>
              <Controller name="branch" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="text-base py-2.5">
                    <SelectValue placeholder="Your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">CTC Min (LPA, optional)</Label>
              <Input {...register('ctc_min', { valueAsNumber: true })} type="number" step="0.5" placeholder="e.g. 8.5" className="text-base py-2.5" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-gray-700">CTC Max (LPA, optional)</Label>
              <Input {...register('ctc_max', { valueAsNumber: true })} type="number" step="0.5" placeholder="e.g. 14" className="text-base py-2.5" />
            </div>
          </div>
        </section>

        {/* Section 2: Overall Experience & Summary */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Overall Experience &amp; Summary</h2>
          <div className="space-y-1.5">
            <Label className="text-base font-semibold text-gray-700">Detailed Overview</Label>
            <Textarea
              {...register('overall_experience')}
              rows={4}
              placeholder="Give a summary of your experience: drive process, atmosphere, CIR coordination, difficulty level, etc."
              className="text-base resize-none"
            />
          </div>
          <div className="space-y-1.5 pt-2">
            <Label className="text-base font-semibold text-gray-700">Preparation Tips</Label>
            <Textarea
              {...register('preparation_tips')}
              rows={3}
              placeholder="What topics or resources were most critical for clearing this company?"
              className="text-base resize-none"
            />
          </div>
        </section>

        {/* Section 3: Display mode */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Display identity</h2>
          <Controller name="display_mode" control={control} render={({ field }) => (
            <div className="space-y-2.5">
              {DISPLAY_MODES.map(m => (
                <label key={m.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={m.value}
                    checked={field.value === m.value}
                    onChange={() => field.onChange(m.value)}
                    className="accent-[#A41D35] h-4 w-4"
                  />
                  <span className="text-base font-medium text-gray-800">{m.label}</span>
                </label>
              ))}
            </div>
          )} />
        </section>

        {/* Section 4: Interview flow */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Interview rounds</h2>
          <p className="text-sm text-gray-500">Drag to reorder. Click a round to edit its specific questions, tips, duration and difficulty.</p>
          <FlowBuilder rounds={rounds} roundTypes={roundTypes} onChange={handleRoundsChange} />
        </section>

        {/* Section 5: Do's */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Do&apos;s ✅</h2>
          {dos.map((d, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={d}
                onChange={e => { const copy = [...dos]; copy[i] = e.target.value; setDos(copy) }}
                placeholder={`Do ${i + 1}…`}
                className="text-base"
              />
              {dos.length > 1 && (
                <button type="button" onClick={() => setDos(dos.filter((_, j) => j !== i))} className="p-2">
                  <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setDos([...dos, ''])}
            className="text-base text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
            <Plus className="w-4 h-4" /> Add do
          </button>
        </section>

        {/* Section 6: Don'ts */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Don&apos;ts ❌</h2>
          {donts.map((d, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={d}
                onChange={e => { const copy = [...donts]; copy[i] = e.target.value; setDonts(copy) }}
                placeholder={`Don't ${i + 1}…`}
                className="text-base"
              />
              {donts.length > 1 && (
                <button type="button" onClick={() => setDonts(donts.filter((_, j) => j !== i))} className="p-2">
                  <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setDonts([...donts, ''])}
            className="text-base text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 pt-1">
            <Plus className="w-4 h-4" /> Add don&apos;t
          </button>
        </section>

        {/* Section 7: Resources */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Helpful resources</h2>
          {resources.map((r, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={r.url}
                onChange={e => {
                  const copy = [...resources]; copy[i] = { ...r, url: e.target.value }; setResources(copy)
                }}
                placeholder="https://…"
                className="text-base"
              />
              <div className="flex gap-2">
                <Input
                  value={r.note}
                  onChange={e => {
                    const copy = [...resources]; copy[i] = { ...r, note: e.target.value }; setResources(copy)
                  }}
                  placeholder="How useful was this? (optional)"
                  className="text-base"
                />
                <button type="button" onClick={() => setResources(resources.filter((_, j) => j !== i))} className="p-2">
                  <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
          <button type="button"
            onClick={() => setResources([...resources, { url: '', note: '' }])}
            className="text-base text-[#A41D35] hover:text-[#8A152A] font-semibold flex items-center gap-1.5 pt-1">
            <Plus className="w-4 h-4" /> Add resource
          </button>
        </section>

        {/* Section 8: One-line advice */}
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">One-line advice</h2>
          <div className="flex flex-col sm:flex-row items-start gap-2.5">
            <span className="text-base text-gray-600 italic shrink-0 pt-2">If I were you, I&apos;d…</span>
            <Textarea
              {...register('advice')}
              rows={2}
              placeholder="focus on data structures and core fundamentals above everything else"
              className="text-base resize-none w-full"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#A41D35] hover:bg-[#8A152A] text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-md disabled:opacity-50 text-lg tracking-wide"
        >
          {submitting ? 'Publishing…' : 'Publish experience →'}
        </button>
      </form>
    </div>
  )
}
