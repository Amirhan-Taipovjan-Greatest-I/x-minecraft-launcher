import { getDiceCoefficient } from '@/util/sort'
import { Mod, Pagination } from '@xmcl/curseforge'
import { SearchResult, SearchResultHit } from '@xmcl/modrinth'
import { Resource } from '@xmcl/runtime-api'
import { Ref } from 'vue'
import { InstanceMod } from './instanceMods'

/**
 * Each search item represent a project of a mod
 */
export interface ModListSearchItem {
  divider?: boolean
  installed?: Resource

  /**
   * The id is representing the id of the project
   */
  id: string
  icon: string
  title: string
  description: string

  forge?: boolean
  fabric?: boolean
  quilt?: boolean

  curseforge?: Mod
  modrinth?: SearchResultHit
  resource?: Resource[]
}

export function useModSearchItems(keyword: Ref<string>, modrinth: Ref<SearchResult | undefined>, curseforge: Ref<{
  data: Mod[]
  pagination: Pagination
} | undefined>, mods: Ref<Resource[]>, instanceMods: Ref<InstanceMod[]>) {
  const tab = ref(0)
  const disableModrinth = computed(() => tab.value !== 0 && tab.value !== 3)
  const disableCurseforge = computed(() => tab.value !== 0 && tab.value !== 2)
  const disableLocal = computed(() => tab.value !== 0 && tab.value !== 1)

  const items = computed(() => {
    const results: [ModListSearchItem, number][] = []
    const modr = modrinth.value
    if (modr && !disableModrinth.value) {
      for (const i of modr.hits) {
        results.push([{
          id: i.project_id,
          icon: i.icon_url,
          title: i.title,
          description: i.description,
          modrinth: i,
        }, getDiceCoefficient(keyword.value, i.title)])
      }
    }
    const cf = curseforge.value
    if (cf && !disableCurseforge.value) {
      for (const i of cf.data) {
        results.push(([{
          id: i.id.toString(),
          icon: i.logo.url,
          title: i.name,
          description: i.summary,
          curseforge: i,
        }, getDiceCoefficient(keyword.value, i.name)]))
      }
    }
    const grouped: Record<string, ModListSearchItem> = {}
    const getItemForResource = (m: InstanceMod) => {
      const description = m.description
      const name = m.name
      if (!grouped[name]) {
        grouped[name] = {
          id: name,
          icon: m.icon,
          title: name,
          description,
          forge: m.modLoaders.indexOf('forge') !== -1,
          fabric: m.modLoaders.indexOf('fabric') !== -1,
          quilt: m.modLoaders.indexOf('quilt') !== -1,
          resource: [m.resource],
        }
        return grouped[name]
      } else {
        if (!grouped[name].resource?.find((r) => r.path === m.path || r.ino === m.ino || r.storedPath === m.storedPath)) {
          grouped[name].resource?.push(m)
          if (m.metadata.forge) grouped[name].forge = true
          if (m.metadata.fabric) grouped[name].fabric = true
          if (m.metadata.quilt) grouped[name].quilt = true
        }
      }
    }
    const prepend: ModListSearchItem[] = []

    for (const i of instanceMods.value) {
      const item = getItemForResource(i)
      if (item) {
        item.installed = i
        prepend.push(item)
      }
    }

    if (prepend.length > 0) {
      prepend.push({
        divider: true,
        id: 'divider',
        icon: '',
        title: '',
        description: '',
      })
    }
    if (!disableLocal.value) {
      for (const m of mods.value) {
        const i = getItemForResource(m)
        if (i) {
          results.push([i, getDiceCoefficient(keyword.value, m.name)])
        }
      }
    }

    results.sort((a, b) => -a[1] + b[1])

    return prepend.concat(results.map(v => v[0]))
  })

  return { items, tab }
}
