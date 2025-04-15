import LayoutMenu from '@/layouts/LayoutMenu.vue'
import { RouteNameEnum } from '@/shared/enums'
import ViewSearch from '@/views/ViewSearch.vue'
import ViewSearchImages from '@/views/ViewSearchImages.vue'
import ViewSearchItems from '@/views/ViewSearchItems.vue'
import ViewUpload from '@/views/ViewUpload.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Dashboard components are more unique and will likely need dedicated routes
    {
      path: '/',
      redirect: `/search`, // Your default route
      name: RouteNameEnum.MENU_LAYOUT,
      component: LayoutMenu, // Must use a different layout for other primary routes
      children: [
        {
          path: '/search',
          name: RouteNameEnum.SEARCH,
          component: ViewSearch,
        },
        {
          path: '/upload',
          name: RouteNameEnum.UPLOAD,
          component: ViewUpload,
        },
        {
          path: '/settings',
          name: RouteNameEnum.SETTINGS,
          component: () => import('@/views/ViewSettings.vue'),
        },
        {
          path: '/:pathMatch(.*)*', // 404 Not Found. Part of default route path.
          name: RouteNameEnum.NOT_FOUND,
          component: () => import('@/views/ViewNotFound.vue'),
        },
      ],
    },
    // Table routes are fullscreen and have no layout
    {
      path: '/view-logs',
      name: RouteNameEnum.VIEW_LOGS,
      component: () => import('@/views/ViewLogsTable.vue'),
    },
    {
      path: '/view-settings',
      name: RouteNameEnum.VIEW_SETTINGS,
      component: () => import('@/views/ViewSettingsTable.vue'),
    },
    {
      path: '/view-prompts',
      name: RouteNameEnum.VIEW_PROMPTS,
      component: () => import('@/views/ViewPromptsTable.vue'),
    },
    {
      path: '/search/images',
      name: RouteNameEnum.SEARCH_IMAGES,
      component: ViewSearchImages,
    },
    {
      path: '/search/items',
      name: RouteNameEnum.SEARCH_ITEMS,
      component: ViewSearchItems,
    },
  ],
})

export default router
