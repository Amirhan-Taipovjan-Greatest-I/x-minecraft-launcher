import { EMPTY_VERSION, Instance, VersionServiceKey, getResolvedVersion } from '@xmcl/runtime-api'
import useSWRV from 'swrv'
import { Ref, InjectionKey } from 'vue'
import { useService } from './service'

function useInstanceVersionBase(instance: Ref<Instance>) {
  const minecraft = computed(() => instance.value.runtime.minecraft)
  const forge = computed(() => instance.value.runtime.forge)
  const fabricLoader = computed(() => instance.value.runtime.fabricLoader)
  const quiltLoader = computed(() => instance.value.runtime.quiltLoader)
  return {
    minecraft,
    forge,
    fabricLoader,
    quiltLoader,
  }
}
export const kInstanceVersion: InjectionKey<ReturnType<typeof useInstanceVersion>> = Symbol('InstanceVersion')

export function useInstanceVersion(instance: Ref<Instance>) {
  const { state, resolveLocalVersion } = useService(VersionServiceKey)
  const versionHeader = computed(() => getResolvedVersion(state.local,
    instance.value.version,
    instance.value.runtime.minecraft,
    instance.value.runtime.forge,
    instance.value.runtime.fabricLoader,
    instance.value.runtime.optifine,
    instance.value.runtime.quiltLoader) || markRaw(EMPTY_VERSION))
  const folder = computed(() => versionHeader.value?.id || 'unknown')

  const { isValidating, mutate, data: resolvedVersion, error } = useSWRV(`/instance/${instance.value.path}/version`, async () => {
    if (versionHeader.value === EMPTY_VERSION || !versionHeader.value.id) {
      return undefined
    }
    return await resolveLocalVersion(versionHeader.value.id)
  })

  watch([versionHeader], () => {
    mutate()
  })

  return {
    ...useInstanceVersionBase(instance),
    folder,
    error,
    versionHeader,
    resolvedVersion,
    isValidating,
  }
}
