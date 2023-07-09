import { useService, useServiceBusy } from '@/composables'
import { JavaRecord, JavaServiceKey, JavaState } from '@xmcl/runtime-api'
import { computed, InjectionKey } from 'vue'
import { DialogKey } from './dialog'
import { useState } from './syncableState'

export const JavaIssueDialogKey: DialogKey<void> = 'java-issue'
export const kJavaContext: InjectionKey<ReturnType<typeof useJavaContext>> = Symbol('JavaContext')

export function useJavaContext() {
  const { getJavaState } = useService(JavaServiceKey)
  const { state, isValidating, error } = useState<JavaState>(ref('java'), getJavaState)
  const all = computed(() => state.value?.all ?? [])
  const missing = computed(() => state.value?.all.length === 0)

  return {
    isValidating,
    missing,
    all,
    error,
    remove: (java: JavaRecord) => state.value?.javaRemove(java),
  }
}
