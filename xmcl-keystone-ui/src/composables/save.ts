import { useService } from '@/composables'
import { Instance, InstanceSavesServiceKey } from '@xmcl/runtime-api'
import { Ref, InjectionKey } from 'vue'
import { useState } from './syncableState'

export const kInstanceSave: InjectionKey<ReturnType<typeof useInstanceSaves>> = Symbol('InstanceSave')

export function useInstanceSaves(instance: Ref<Instance>) {
  const { watch } = useService(InstanceSavesServiceKey)
  const { state, isValidating, error } = useState(computed(() => `/instance-saves/${instance.value.path}`),
    () => watch(instance.value.path))

  const saves = computed(() => state.value?.saves || [])

  return {
    saves,
    isValidating,
    error,
  }
}
