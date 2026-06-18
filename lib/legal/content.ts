/**
 * Terms of Use + Privacy Policy content. User-favorable, no-tracking,
 * GDPR-aligned. Drafted per the user's "draft as final" instruction.
 *
 * PROFESSIONAL NOTE (recorded once): legal documents normally warrant review by
 * qualified counsel before publication, particularly the GDPR-rights and
 * liability clauses. Proceeding as final per the user's explicit choice.
 *
 * Structured as sections so the renderer is locale-agnostic. English is the
 * authoritative draft; es/fr/ar are provided. Replace org/contact specifics
 * before launch.
 */

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };
type Locale = "en" | "es" | "fr" | "ar";

const UPDATED = "2026-06-18";
const CONTACT = "privacy@connectingclimateminds.org";

export const PRIVACY: Record<Locale, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro:
      "Connecting Climate Minds is a community for people working at the intersection of climate change and mental health. We collect the minimum data needed to run the Hub, we do not sell or share your data for advertising, and we use no invasive tracking. This policy explains what we hold and your rights over it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account details you provide: name, email, username, and anything you choose to add to your profile (bio, location, work details, links).",
          "Content you create: case studies, lived experiences, comments, workspace files and messages.",
          "Operational data needed to run the service: authentication sessions (via Clerk) and aggregate download counts. We do not store IP addresses or device fingerprints for analytics.",
        ],
      },
      {
        heading: "Analytics and tracking",
        body: [
          "We use Plausible Analytics, which is cookie-free and collects no personal data — no cross-site tracking, no advertising profiles. There are no third-party advertising or social tracking pixels.",
          "We set only essential cookies (your login session, language, and cookie-consent choice).",
        ],
      },
      {
        heading: "How we use your data",
        body: [
          "To operate the Hub: show your profile and content, deliver comments and messages, and send service notifications you have not opted out of.",
          "We rely on your consent for optional notification emails (which you can turn off anytime), and on legitimate interest for core service operation.",
        ],
      },
      {
        heading: "Who processes your data",
        body: [
          "We use trusted processors solely to run the service: Clerk (authentication), Sanity (content), a database provider (Neon/Postgres), Cloudflare R2 (files), Algolia (search), Resend (email), and Vercel (hosting). Each handles data only on our instructions.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can access and download all your data at any time (Account → Export), correct it (your profile is editable), and delete your account — which erases your personal data, comments, messages, files and search record. Published case studies are retained as community knowledge; contact us to request removal.",
          "You can object to processing, restrict it, or withdraw consent for emails. To exercise any right, use the in-app tools or email " + CONTACT + ".",
        ],
      },
      {
        heading: "Retention",
        body: [
          "We keep your data while your account is active. On deletion it is erased promptly. Aggregate, non-identifying counts may be retained.",
        ],
      },
      {
        heading: "Contact",
        body: ["Questions about your data: " + CONTACT + "."],
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    updated: UPDATED,
    intro:
      "Connecting Climate Minds es una comunidad para personas que trabajan en la intersección del cambio climático y la salud mental. Recopilamos los datos mínimos necesarios, no vendemos ni compartimos tus datos con fines publicitarios y no usamos rastreo invasivo.",
    sections: [
      { heading: "Qué recopilamos", body: ["Los datos de tu cuenta y perfil, el contenido que creas y los datos operativos mínimos. No almacenamos direcciones IP para análisis."] },
      { heading: "Análisis y rastreo", body: ["Usamos Plausible Analytics, sin cookies y sin datos personales. Solo usamos cookies esenciales."] },
      { heading: "Tus derechos", body: ["Puedes acceder, descargar, corregir y eliminar tus datos en cualquier momento. Para cualquier solicitud, escribe a " + CONTACT + "."] },
      { heading: "Contacto", body: [CONTACT] },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: UPDATED,
    intro:
      "Connecting Climate Minds est une communauté pour les personnes travaillant à l'intersection du changement climatique et de la santé mentale. Nous collectons le minimum de données nécessaires, ne vendons ni ne partageons vos données à des fins publicitaires et n'utilisons aucun suivi invasif.",
    sections: [
      { heading: "Ce que nous collectons", body: ["Les informations de votre compte et profil, le contenu que vous créez et des données opérationnelles minimales. Nous ne stockons pas d'adresses IP à des fins d'analyse."] },
      { heading: "Analyse et suivi", body: ["Nous utilisons Plausible Analytics, sans cookies et sans données personnelles. Nous n'utilisons que des cookies essentiels."] },
      { heading: "Vos droits", body: ["Vous pouvez accéder, télécharger, corriger et supprimer vos données à tout moment. Pour toute demande, écrivez à " + CONTACT + "."] },
      { heading: "Contact", body: [CONTACT] },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: UPDATED,
    intro:
      "Connecting Climate Minds مجتمع للأشخاص العاملين عند تقاطع تغيّر المناخ والصحة النفسية. نجمع الحد الأدنى من البيانات اللازمة، ولا نبيع بياناتك أو نشاركها لأغراض إعلانية، ولا نستخدم تتبعًا تطفليًا.",
    sections: [
      { heading: "ما الذي نجمعه", body: ["بيانات حسابك وملفك الشخصي، والمحتوى الذي تنشئه، والبيانات التشغيلية الدنيا. لا نخزّن عناوين IP لأغراض التحليل."] },
      { heading: "التحليلات والتتبع", body: ["نستخدم Plausible Analytics بدون ملفات تعريف ارتباط وبدون بيانات شخصية. نستخدم فقط ملفات تعريف الارتباط الأساسية."] },
      { heading: "حقوقك", body: ["يمكنك الوصول إلى بياناتك وتنزيلها وتصحيحها وحذفها في أي وقت. لأي طلب راسلنا على " + CONTACT + "."] },
      { heading: "التواصل", body: [CONTACT] },
    ],
  },
};

export const TERMS: Record<Locale, LegalDoc> = {
  en: {
    title: "Terms of Use",
    updated: UPDATED,
    intro:
      "These terms govern your use of Connecting Climate Minds. They are written to be fair to you: you keep ownership of what you create, we ask only for what we need to run the community, and we treat this as a respectful, research-oriented space.",
    sections: [
      { heading: "Your account", body: ["You're responsible for your account and for keeping it secure. You must be eligible to use the service under applicable law."] },
      { heading: "Your content", body: ["You keep ownership of the content you create. By posting, you grant us a limited licence to display and distribute it within the Hub so the community can see it. You can delete your content; published case studies may be retained as community knowledge (contact us for removal)."] },
      { heading: "Community conduct", body: ["This is a space for a vulnerable, research-focused community. Be respectful. Harassment, hateful content, and harmful conduct are not allowed and may be removed. Comments may be moderated; clearly harmful content is blocked."] },
      { heading: "Privacy", body: ["Your use is also governed by our Privacy Policy. We don't track you invasively and we give you control over your data."] },
      { heading: "Liability", body: ["The service is provided as-is. To the extent permitted by law, we limit our liability — but nothing here removes rights you have as a consumer or data subject."] },
      { heading: "Changes", body: ["We may update these terms; we'll note the date of the latest version. Continued use means acceptance of the current terms."] },
      { heading: "Contact", body: ["Questions: " + CONTACT + "."] },
    ],
  },
  es: {
    title: "Términos de Uso",
    updated: UPDATED,
    intro: "Estos términos rigen tu uso de Connecting Climate Minds y están redactados para ser justos contigo: conservas la propiedad de lo que creas y solo pedimos lo necesario para gestionar la comunidad.",
    sections: [
      { heading: "Tu contenido", body: ["Conservas la propiedad de tu contenido y nos otorgas una licencia limitada para mostrarlo dentro del Hub."] },
      { heading: "Conducta", body: ["Es un espacio respetuoso y orientado a la investigación. No se permite el acoso ni el contenido dañino."] },
      { heading: "Contacto", body: [CONTACT] },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    updated: UPDATED,
    intro: "Ces conditions régissent votre utilisation de Connecting Climate Minds et sont rédigées pour être équitables : vous conservez la propriété de ce que vous créez et nous ne demandons que le nécessaire.",
    sections: [
      { heading: "Votre contenu", body: ["Vous conservez la propriété de votre contenu et nous accordez une licence limitée pour l'afficher au sein du Hub."] },
      { heading: "Conduite", body: ["C'est un espace respectueux et axé sur la recherche. Le harcèlement et les contenus nuisibles ne sont pas autorisés."] },
      { heading: "Contact", body: [CONTACT] },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    updated: UPDATED,
    intro: "تحكم هذه الشروط استخدامك لـ Connecting Climate Minds، وقد صيغت لتكون منصفة لك: تحتفظ بملكية ما تنشئه، ونطلب فقط ما يلزم لإدارة المجتمع.",
    sections: [
      { heading: "محتواك", body: ["تحتفظ بملكية محتواك وتمنحنا ترخيصًا محدودًا لعرضه داخل المنصة."] },
      { heading: "السلوك", body: ["هذه مساحة محترمة وموجهة نحو البحث. لا يُسمح بالمضايقة أو المحتوى الضار."] },
      { heading: "التواصل", body: [CONTACT] },
    ],
  },
};
