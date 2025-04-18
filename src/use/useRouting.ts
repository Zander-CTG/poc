import useLogger from '@/use/useLogger'
import { useRouter } from 'vue-router'

/**
 * Provides some routing utilities and access to the current route Service if any.
 */
export default function useRouting() {
  // Do NOT return route or router from any composable due to performance issues
  const router = useRouter()
  const { log } = useLogger()

  /**
   * Go back if previous route state is part of the app history, otherwise go to root path.
   */
  function goBack() {
    try {
      if (router?.options?.history?.state?.back) {
        router.back()
      } else {
        router.push('/')
      }
    } catch (error) {
      log.error('Error accessing previous route', error as Error)
    }
  }

  return { goBack }
}
