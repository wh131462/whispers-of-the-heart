import { useState, useEffect, useCallback } from 'react'

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseFetchOptions {
  immediate?: boolean
  headers?: Record<string, string>
}

export function useFetch<T = any>(
  url: string,
  options: UseFetchOptions = {}
): [FetchState<T>, () => Promise<void>] {
  const { immediate = true, headers = {} } = options
  
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      })
    }
  }, [url, headers])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [fetchData, immediate])

  return [state, fetchData]
}

// POST 请求 hook
export function usePost<T = any, R = any>(
  url: string,
  options: UseFetchOptions = {}
): [FetchState<R>, (data: T) => Promise<void>] {
  const { headers = {} } = options
  
  const [state, setState] = useState<FetchState<R>>({
    data: null,
    loading: false,
    error: null,
  })

  const postData = useCallback(async (data: T) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setState({ data: result, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      })
    }
  }, [url, headers])

  return [state, postData]
}
