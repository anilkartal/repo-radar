import type { Messages } from './messages';

export const tr: Messages = {
  appName: 'Repo Radar',
  tagline: "AI alanında en çok yıldız alan yeni GitHub repo'ları; her biri ne işe yarar, nasıl başlanır, kısaca.",
  lastUpdated: (date) => `Son güncelleme: ${date}`,

  langToggleLabel: 'Dil',
  langName: { tr: 'Türkçe', en: 'English' },

  periodTabsLabel: 'Oluşturulma zamanı',
  period: { 30: '1 Ay', 90: '3 Ay', 180: '6 Ay', 365: '1 Yıl' },
  periodLong: { 30: 'Son 1 ay', 90: 'Son 3 ay', 180: 'Son 6 ay', 365: 'Son 1 yıl' },

  categoryChipsLabel: 'Kategori',
  category: {
    skills: 'Claude & AI Skills',
    'ai-tools': 'AI Araçları',
    rag: 'RAG',
    prompts: 'Promptlar',
    'agent-building': 'Ajan Geliştirme',
    'ai-quality': 'AI Kalitesi',
    learning: 'Öğrenme Kaynakları',
    popular: 'Genel Popüler',
  },

  searchLabel: "Repo'larda ara",
  searchPlaceholder: 'İsim, açıklama, topic ile ara…',
  languageFilterLabel: 'Programlama dili',
  allLanguages: 'Tüm diller',

  resultCount: (count) => `${count} repo`,
  rank: (n) => `#${n}`,
  stars: (formatted) => `${formatted} yıldız`,
  starsLabel: 'Yıldız',
  createdLabel: 'Oluşturuldu',
  openOnGitHub: (fullName) => `${fullName} reposunu GitHub'da aç`,
  howToUse: 'Nasıl kullanılır?',
  useCases: 'Kullanım alanları',
  topicsLabel: 'Topic\'ler',
  summaryPending: 'Özet hazırlanıyor, GitHub açıklaması gösteriliyor.',

  loading: "Repo'lar yükleniyor…",
  emptyTitle: 'Eşleşen repo yok',
  emptyHint: 'Başka bir arama, dönem veya kategori deneyin.',
  errorTitle: 'Repo listesi yüklenemedi',
  errorHint: 'Bağlantınızı kontrol edip tekrar deneyin.',
  retry: 'Tekrar dene',
};
