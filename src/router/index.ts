import { createRouter, createWebHistory } from 'vue-router';
import FileDetails from '../components/FileDetails.vue';
import FileEdit from '../components/FileEdit.vue';
import HomePage from '../views/HomePage.vue';
import BookListPage from '../views/BookListPage.vue';
import BookCatalogPage from '../views/BookCatalogPage.vue';
import FigureCatalogPage from '../views/FigureCatalogPage.vue';
import FileListPage from '../views/FileListPage.vue';
import DocumentDigitalizationPage from '../views/DocumentDigitalizationPage.vue';
import DocumentPreviewPage from '../views/DocumentPreviewPage.vue';
import KnowledgeGraphPage from '../views/KnowledgeGraphPage.vue';
import HierarchicalGraphPage from '../views/HierarchicalGraphPage.vue';
import LoginPage from '../views/LoginPage.vue';
import MainLayout from '../views/MainLayout.vue';
import ModulePlaceholder from '../views/ModulePlaceholder.vue';
import MetadataGeneratorPage from '../views/MetadataGeneratorPage.vue';
import MediaSelectionPage from '../views/MediaSelectionPage.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/',
    redirect: '/media-selection'
  },
  {
    path: '/media-selection',
    name: 'mediaSelection',
    component: MediaSelectionPage,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: MainLayout,
    redirect: '/dashboard/text',
    children: [
      { path: 'text', name: 'text-module', component: HomePage },
      { path: 'image', name: 'image-module', component: ModulePlaceholder },
      { path: 'video', name: 'video-module', component: ModulePlaceholder },
      { path: 'audio', name: 'audio-module', component: ModulePlaceholder },
      { path: 'chart', name: 'chart-module', component: ModulePlaceholder },
      { path: 'map', name: 'map-module', component: ModulePlaceholder },
    ]
  },
  {
    path: '/files/details/:id',
    name: 'FileDetails',
    component: FileDetails,
  },
  {
    path: '/files/edit/:id',
    name: 'FileEdit',
    component: FileEdit,
    props: true,
  },
  {
    path: '/file-list',
    name: 'fileList',
    component: FileListPage,
  },
  {
    path: '/books',
    name: 'books',
    component: BookListPage,
  },
  {
    path: '/book-catalog/:bookId?',
    name: 'bookCatalog',
    component: BookCatalogPage,
  },
  {
    path: '/figure-catalog/:bookId?',
    name: 'figureCatalog',
    component: FigureCatalogPage,
  },
  {
    path: '/document-digitalization',
    name: 'documentDigitalization',
    component: DocumentDigitalizationPage,
  },
  {
    path: '/document-preview',
    name: 'documentPreview',
    component: DocumentPreviewPage,
  },
  {
    path: '/knowledge-graph',
    name: 'knowledgeGraph',
    component: KnowledgeGraphPage,
  },
  {
    path: '/hierarchical-graph',
    name: 'hierarchicalGraph',
    component: HierarchicalGraphPage,
  },
  {
    path: '/metadata-generator',
    name: 'metadataGenerator',
    component: MetadataGeneratorPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  if (to.name !== 'login' && to.name !== 'mediaSelection' && !isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;