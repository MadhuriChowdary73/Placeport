'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function usePosts(filters: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters)
      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      return res.json()
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`)
      if (!res.ok) throw new Error('Post not found')
      return res.json()
    },
  })
}

export function useCompanies(search?: string) {
  return useQuery({
    queryKey: ['companies', search],
    queryFn: async () => {
      const res = await fetch(`/api/companies${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch companies')
      return res.json()
    },
    staleTime: 300_000,
  })
}

export function useRoundTypes() {
  return useQuery({
    queryKey: ['round-types'],
    queryFn: async () => {
      const res = await fetch('/api/round-types')
      if (!res.ok) throw new Error('Failed to fetch round types')
      return res.json()
    },
    staleTime: Infinity,
  })
}
