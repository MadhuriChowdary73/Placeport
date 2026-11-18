'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useVote(postId: string) {
  const qc = useQueryClient()

  const { data: voted } = useQuery({
    queryKey: ['vote', postId],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()
      return !!data
    },
  })

  const { mutate: toggleVote, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      if (!res.ok) throw new Error('Failed to toggle vote')
      return res.json()
    },
    onSuccess: (data) => {
      qc.setQueryData(['vote', postId], data.voted)
      qc.invalidateQueries({ queryKey: ['post', postId] })
      qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return { voted: voted ?? false, toggleVote, isPending }
}

export function useSave(postId: string) {
  const qc = useQueryClient()

  const { data: saved } = useQuery({
    queryKey: ['save', postId],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      const { data } = await supabase
        .from('saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()
      return !!data
    },
  })

  const { mutate: toggleSave, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      if (!res.ok) throw new Error('Failed to toggle save')
      return res.json()
    },
    onSuccess: (data) => {
      qc.setQueryData(['save', postId], data.saved)
      qc.invalidateQueries({ queryKey: ['post', postId] })
      qc.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })

  return { saved: saved ?? false, toggleSave, isPending }
}
