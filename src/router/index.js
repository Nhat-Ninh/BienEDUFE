import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // Trang công khai (Public Landing & Commercial)
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/public/HomeLandingView.vue'),
    meta: { public: true }
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/public/PricingView.vue'),
    meta: { public: true }
  },
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: () => import('@/views/public/RoadmapView.vue'),
    meta: { public: true }
  },
  {
    path: '/report/public/:token',
    name: 'PublicReport',
    component: () => import('@/views/public/PublicReportView.vue'),
    meta: { public: true }
  },

  // Auth Layout (Login, Register)
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { guestOnly: true }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { guestOnly: true }
      }
    ]
  },
  {
    path: '/login',
    redirect: '/auth/login'
  },
  {
    path: '/register',
    redirect: '/auth/register'
  },

  // Hệ thống ứng dụng nội bộ (Main App Portal)
  {
    path: '/app',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/app/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue')
      },
      {
        path: 'classes',
        name: 'Classes',
        component: () => import('@/views/classes/ClassListView.vue')
      },
      {
        path: 'classes/:classId',
        name: 'ClassDetail',
        component: () => import('@/views/classes/ClassDetailView.vue')
      },
      {
        path: 'assignments',
        name: 'Assignments',
        component: () => import('@/views/assignments/AssignmentListView.vue')
      },
      {
        path: 'assignments/:assignmentId/do',
        name: 'AssignmentTake',
        component: () => import('@/views/assignments/AssignmentTakeView.vue')
      },
      {
        path: 'submissions/:submissionId',
        name: 'SubmissionResult',
        component: () => import('@/views/assignments/SubmissionResultView.vue')
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/practice/PracticeView.vue')
      },
      {
        path: 'mistakes',
        name: 'Mistakes',
        component: () => import('@/views/mistakes/MistakesView.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/AnalyticsView.vue')
      },
      {
        path: 'subscription',
        name: 'Subscription',
        component: () => import('@/views/subscription/SubscriptionView.vue')
      },
      // Giáo viên
      {
        path: 'teacher/lessons',
        name: 'TeacherLessons',
        component: () => import('@/views/teacher/TeacherLessonsView.vue'),
        meta: { role: 'TEACHER' }
      },
      {
        path: 'teacher/exercises',
        name: 'TeacherExercises',
        component: () => import('@/views/teacher/TeacherExerciseBankView.vue'),
        meta: { role: 'TEACHER' }
      },
      {
        path: 'teacher/exercise-bank',
        redirect: '/app/teacher/exercises'
      },
      {
        path: 'teacher/grading',
        name: 'TeacherGrading',
        component: () => import('@/views/teacher/TeacherGradingView.vue'),
        meta: { role: 'TEACHER' }
      }
    ]
  },

  // Fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Route Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/auth/login', query: { redirect: to.fullPath } })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ path: '/app/dashboard' })
  } else if (to.meta.role && authStore.user?.role !== to.meta.role) {
    next({ path: '/app/dashboard' })
  } else {
    next()
  }
})

export default router
