import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const messagesDir = join(__dirname, '../messages');

const translations = {
  es: {
    "caseStudies": {
      "title": "Estudios de Caso",
      "description": "Explora investigaciones y perspectivas de nuestra comunidad global",
      "pageTitle": "Estudios de Caso",
      "pageDescription": "Explora investigaciones y perspectivas de nuestra comunidad global",
      "featured": "Estudios de Caso Destacados",
      "recent": "Publicados Recientemente",
      "browseByTopic": "Navegar por Tema",
      "viewAll": "Ver Todos",
      "searchButton": "Buscar",
      "submitButton": "Enviar Estudio de Caso",
      "searchResults": "Resultados de Búsqueda",
      "resultsFound": "resultados encontrados",
      "noResults": "No se encontraron estudios de caso",
      "noResultsDescription": "Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.",
      "clearFilters": "Borrar todos los filtros",
      "filters": {
        "searchPlaceholder": "Buscar estudios de caso...",
        "topicPlaceholder": "Todos los Temas",
        "tagPlaceholder": "Todas las Etiquetas",
        "communityPlaceholder": "Todas las Comunidades",
        "filters": "Filtros",
        "tag": "Etiquetas",
        "community": "Comunidad",
        "activeFilters": "Filtros activos",
        "clearAll": "Borrar todo",
        "updating": "Actualizando...",
        "all": "Todos los Temas",
        "featured": "Destacados",
        "recent": "Publicados Recientemente"
      },
      "topics": {
        "climate-environment": "Cambio Climático y Medio Ambiente",
        "mental-health": "Salud Mental y Bienestar",
        "community-health": "Salud Comunitaria y Atención Social",
        "youth-education": "Participación Juvenil y Educación",
        "policy-governance": "Investigación de Políticas y Gobernanza",
        "technology-innovation": "Tecnología e Innovación",
        "economic-development": "Desarrollo Económico",
        "cultural-arts": "Patrimonio Cultural y Artes",
        "food-agriculture": "Seguridad Alimentaria y Agricultura",
        "urban-planning": "Planificación Urbana e Infraestructura",
        "human-rights": "Derechos Humanos y Justicia Social",
        "migration": "Migración y Desplazamiento",
        "gender-equality": "Igualdad de Género",
        "disaster-resilience": "Riesgo de Desastres y Resiliencia",
        "digital-inclusion": "Inclusión Digital",
        "other": "Otro"
      },
      "meta": {
        "authors": "autor",
        "authorsPlural": "autores",
        "readTime": "min de lectura",
        "publishedAt": "Publicado",
        "submittedAt": "Enviado"
      }
    },
    "caseStudy": {
      "backToCaseStudies": "Volver a Estudios de Caso"
    }
  },
  fr: {
    "caseStudies": {
      "title": "Études de Cas",
      "description": "Explorez la recherche et les perspectives de notre communauté mondiale",
      "pageTitle": "Études de Cas",
      "pageDescription": "Explorez la recherche et les perspectives de notre communauté mondiale",
      "featured": "Études de Cas en Vedette",
      "recent": "Récemment Publiées",
      "browseByTopic": "Parcourir par Thème",
      "viewAll": "Voir Tout",
      "searchButton": "Rechercher",
      "submitButton": "Soumettre une Étude de Cas",
      "searchResults": "Résultats de Recherche",
      "resultsFound": "résultats trouvés",
      "noResults": "Aucune étude de cas trouvée",
      "noResultsDescription": "Essayez d'ajuster votre recherche ou vos filtres pour trouver ce que vous cherchez.",
      "clearFilters": "Effacer tous les filtres",
      "filters": {
        "searchPlaceholder": "Rechercher des études de cas...",
        "topicPlaceholder": "Tous les Thèmes",
        "tagPlaceholder": "Toutes les Étiquettes",
        "communityPlaceholder": "Toutes les Communautés",
        "filters": "Filtres",
        "tag": "Étiquettes",
        "community": "Communauté",
        "activeFilters": "Filtres actifs",
        "clearAll": "Tout effacer",
        "updating": "Mise à jour...",
        "all": "Tous les Thèmes",
        "featured": "En Vedette",
        "recent": "Récemment Publiées"
      },
      "topics": {
        "climate-environment": "Changement Climatique et Environnement",
        "mental-health": "Santé Mentale et Bien-être",
        "community-health": "Santé Communautaire et Soins Sociaux",
        "youth-education": "Engagement des Jeunes et Éducation",
        "policy-governance": "Recherche sur les Politiques et Gouvernance",
        "technology-innovation": "Technologie et Innovation",
        "economic-development": "Développement Économique",
        "cultural-arts": "Patrimoine Culturel et Arts",
        "food-agriculture": "Sécurité Alimentaire et Agriculture",
        "urban-planning": "Planification Urbaine et Infrastructure",
        "human-rights": "Droits de l'Homme et Justice Sociale",
        "migration": "Migration et Déplacement",
        "gender-equality": "Égalité des Genres",
        "disaster-resilience": "Risque de Catastrophes et Résilience",
        "digital-inclusion": "Inclusion Numérique",
        "other": "Autre"
      },
      "meta": {
        "authors": "auteur",
        "authorsPlural": "auteurs",
        "readTime": "min de lecture",
        "publishedAt": "Publié",
        "submittedAt": "Soumis"
      }
    },
    "caseStudy": {
      "backToCaseStudies": "Retour aux Études de Cas"
    }
  },
  ar: {
    "caseStudies": {
      "title": "دراسات الحالة",
      "description": "استكشف الأبحاث والرؤى من مجتمعنا العالمي",
      "pageTitle": "دراسات الحالة",
      "pageDescription": "استكشف الأبحاث والرؤى من مجتمعنا العالمي",
      "featured": "دراسات حالة مميزة",
      "recent": "المنشورة مؤخراً",
      "browseByTopic": "تصفح حسب الموضوع",
      "viewAll": "عرض الكل",
      "searchButton": "بحث",
      "submitButton": "تقديم دراسة حالة",
      "searchResults": "نتائج البحث",
      "resultsFound": "النتائج الموجودة",
      "noResults": "لم يتم العثور على دراسات حالة",
      "noResultsDescription": "حاول تعديل بحثك أو الفلاتر للعثور على ما تبحث عنه.",
      "clearFilters": "مسح جميع الفلاتر",
      "filters": {
        "searchPlaceholder": "البحث في دراسات الحالة...",
        "topicPlaceholder": "جميع المواضيع",
        "tagPlaceholder": "جميع العلامات",
        "communityPlaceholder": "جميع المجتمعات",
        "filters": "الفلاتر",
        "tag": "العلامات",
        "community": "المجتمع",
        "activeFilters": "الفلاتر النشطة",
        "clearAll": "مسح الكل",
        "updating": "جاري التحديث...",
        "all": "جميع المواضيع",
        "featured": "مميزة",
        "recent": "المنشورة مؤخراً"
      },
      "topics": {
        "climate-environment": "تغير المناخ والبيئة",
        "mental-health": "الصحة النفسية والرفاهية",
        "community-health": "صحة المجتمع والرعاية الاجتماعية",
        "youth-education": "مشاركة الشباب والتعليم",
        "policy-governance": "بحوث السياسات والحوكمة",
        "technology-innovation": "التكنولوجيا والابتكار",
        "economic-development": "التنمية الاقتصادية",
        "cultural-arts": "التراث الثقافي والفنون",
        "food-agriculture": "الأمن الغذائي والزراعة",
        "urban-planning": "التخطيط الحضري والبنية التحتية",
        "human-rights": "حقوق الإنسان والعدالة الاجتماعية",
        "migration": "الهجرة والنزوح",
        "gender-equality": "المساواة بين الجنسين",
        "disaster-resilience": "مخاطر الكوارث والمرونة",
        "digital-inclusion": "الشمول الرقمي",
        "other": "أخرى"
      },
      "meta": {
        "authors": "مؤلف",
        "authorsPlural": "مؤلفون",
        "readTime": "دقيقة قراءة",
        "publishedAt": "نُشر في",
        "submittedAt": "قُدم في"
      }
    },
    "caseStudy": {
      "backToCaseStudies": "العودة إلى دراسات الحالة"
    }
  }
};

async function addTranslations() {
  for (const [lang, content] of Object.entries(translations)) {
    const filePath = join(messagesDir, `${lang}.json`);
    console.log(`\nProcessing ${lang}.json...`);

    try {
      const data = await fs.readJson(filePath);

      // Add or update caseStudies
      data.caseStudies = content.caseStudies;
      data.caseStudy = content.caseStudy;

      // Write back
      await fs.writeJson(filePath, data, { spaces: 2 });
      console.log(`✅ Updated ${lang}.json with case studies translations`);
    } catch (error) {
      console.error(`❌ Error updating ${lang}.json:`, error.message);
    }
  }

  console.log('\n✅ All translations added successfully!');
}

addTranslations();
