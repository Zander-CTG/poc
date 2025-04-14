import LayoutMenu from '@/layouts/LayoutMenu.vue'
import { RouteNameEnum } from '@/shared/enums'
import { tableSchema } from '@/shared/schemas'
import ViewImageSearch from '@/views/ViewImageSearch.vue'
import ViewSearch from '@/views/ViewSearch.vue'
import ViewTable from '@/views/ViewTable.vue'
import ViewTabularSearch from '@/views/ViewTabularSearch.vue'
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
      path: '/:table/table',
      name: RouteNameEnum.TABLE,
      component: ViewTable,
      beforeEnter: (to: any, _: any, next: any) => {
        const routeTable = to.params.table
        const isRouteTable = tableSchema.safeParse(routeTable).success

        if (!isRouteTable) {
          return next({
            name: RouteNameEnum.NOT_FOUND,
          })
        }
        return next()
      },
    },
    {
      path: '/image-search',
      name: RouteNameEnum.IMAGE_SEARCH,
      component: ViewImageSearch,
    },
    {
      path: '/tabular-search',
      name: RouteNameEnum.TABULAR_SEARCH,
      component: ViewTabularSearch,
    },
  ],
})

export default router
