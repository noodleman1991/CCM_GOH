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
      {
        heading: "Qué recopilamos",
        body: [
          "Datos de cuenta que proporcionas: nombre, correo electrónico, nombre de usuario y lo que decidas añadir a tu perfil (biografía, ubicación, datos de trabajo, enlaces).",
          "Contenido que creas: estudios de caso, experiencias vividas, comentarios, archivos de espacios de trabajo y mensajes.",
          "Datos operativos necesarios para prestar el servicio: sesiones de autenticación (mediante Clerk) y recuentos agregados de descargas. No almacenamos direcciones IP ni huellas de dispositivo con fines analíticos.",
        ],
      },
      {
        heading: "Análisis y rastreo",
        body: [
          "Usamos Plausible Analytics, que no utiliza cookies ni recopila datos personales: sin rastreo entre sitios ni perfiles publicitarios. No hay píxeles de publicidad ni de redes sociales de terceros.",
          "Solo establecemos cookies esenciales (tu sesión, el idioma y tu elección de consentimiento de cookies).",
        ],
      },
      {
        heading: "Cómo usamos tus datos",
        body: [
          "Para operar el Hub: mostrar tu perfil y contenido, entregar comentarios y mensajes, y enviar notificaciones del servicio que no hayas desactivado.",
          "Nos basamos en tu consentimiento para los correos de notificación opcionales (que puedes desactivar en cualquier momento) y en el interés legítimo para la operación esencial del servicio.",
        ],
      },
      {
        heading: "Quién procesa tus datos",
        body: [
          "Usamos encargados de confianza únicamente para prestar el servicio: Clerk (autenticación), Sanity (contenido), un proveedor de base de datos (Neon/Postgres), Cloudflare R2 (archivos), Algolia (búsqueda), Resend (correo) y Vercel (alojamiento). Cada uno trata los datos solo según nuestras instrucciones.",
        ],
      },
      {
        heading: "Tus derechos",
        body: [
          "Puedes acceder a todos tus datos y descargarlos en cualquier momento (Cuenta → Exportar), corregirlos (tu perfil es editable) y eliminar tu cuenta, lo que borra tus datos personales, comentarios, mensajes, archivos y tu registro de búsqueda. Los estudios de caso publicados se conservan como conocimiento comunitario; contáctanos para solicitar su retirada.",
          "Puedes oponerte al tratamiento, restringirlo o retirar el consentimiento para los correos. Para ejercer cualquier derecho, usa las herramientas de la aplicación o escribe a " + CONTACT + ".",
        ],
      },
      {
        heading: "Conservación",
        body: [
          "Conservamos tus datos mientras tu cuenta está activa. Al eliminarla se borran con prontitud. Pueden conservarse recuentos agregados no identificativos.",
        ],
      },
      {
        heading: "Contacto",
        body: ["Preguntas sobre tus datos: " + CONTACT + "."],
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: UPDATED,
    intro:
      "Connecting Climate Minds est une communauté pour les personnes travaillant à l'intersection du changement climatique et de la santé mentale. Nous collectons le minimum de données nécessaires, ne vendons ni ne partageons vos données à des fins publicitaires et n'utilisons aucun suivi invasif.",
    sections: [
      {
        heading: "Ce que nous collectons",
        body: [
          "Les informations de compte que vous fournissez : nom, e-mail, nom d'utilisateur et ce que vous choisissez d'ajouter à votre profil (bio, localisation, informations professionnelles, liens).",
          "Le contenu que vous créez : études de cas, expériences vécues, commentaires, fichiers d'espaces de travail et messages.",
          "Les données opérationnelles nécessaires au service : sessions d'authentification (via Clerk) et compteurs de téléchargements agrégés. Nous ne stockons ni adresses IP ni empreintes d'appareil à des fins d'analyse.",
        ],
      },
      {
        heading: "Analyse et suivi",
        body: [
          "Nous utilisons Plausible Analytics, sans cookies et sans collecte de données personnelles : pas de suivi inter-sites, pas de profils publicitaires. Aucun pixel publicitaire ou de réseau social tiers.",
          "Nous ne déposons que des cookies essentiels (votre session, la langue et votre choix de consentement aux cookies).",
        ],
      },
      {
        heading: "Comment nous utilisons vos données",
        body: [
          "Pour faire fonctionner le Hub : afficher votre profil et votre contenu, acheminer commentaires et messages, et envoyer les notifications de service que vous n'avez pas désactivées.",
          "Nous nous appuyons sur votre consentement pour les e-mails de notification facultatifs (désactivables à tout moment) et sur l'intérêt légitime pour le fonctionnement essentiel du service.",
        ],
      },
      {
        heading: "Qui traite vos données",
        body: [
          "Nous faisons appel à des sous-traitants de confiance uniquement pour faire fonctionner le service : Clerk (authentification), Sanity (contenu), un fournisseur de base de données (Neon/Postgres), Cloudflare R2 (fichiers), Algolia (recherche), Resend (e-mail) et Vercel (hébergement). Chacun ne traite les données que sur nos instructions.",
        ],
      },
      {
        heading: "Vos droits",
        body: [
          "Vous pouvez accéder à toutes vos données et les télécharger à tout moment (Compte → Exporter), les corriger (votre profil est modifiable) et supprimer votre compte — ce qui efface vos données personnelles, commentaires, messages, fichiers et votre fiche de recherche. Les études de cas publiées sont conservées comme savoir communautaire ; contactez-nous pour en demander le retrait.",
          "Vous pouvez vous opposer au traitement, le restreindre ou retirer votre consentement aux e-mails. Pour exercer un droit, utilisez les outils de l'application ou écrivez à " + CONTACT + ".",
        ],
      },
      {
        heading: "Conservation",
        body: [
          "Nous conservons vos données tant que votre compte est actif. À la suppression, elles sont effacées rapidement. Des compteurs agrégés non identifiants peuvent être conservés.",
        ],
      },
      {
        heading: "Contact",
        body: ["Questions sur vos données : " + CONTACT + "."],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: UPDATED,
    intro:
      "Connecting Climate Minds مجتمع للأشخاص العاملين عند تقاطع تغيّر المناخ والصحة النفسية. نجمع الحد الأدنى من البيانات اللازمة، ولا نبيع بياناتك أو نشاركها لأغراض إعلانية، ولا نستخدم تتبعًا تطفليًا.",
    sections: [
      {
        heading: "ما الذي نجمعه",
        body: [
          "بيانات الحساب التي تقدّمها: الاسم والبريد الإلكتروني واسم المستخدم وما تختار إضافته إلى ملفك الشخصي (نبذة، الموقع، تفاصيل العمل، روابط).",
          "المحتوى الذي تنشئه: دراسات الحالة والتجارب المعيشة والتعليقات وملفات مساحات العمل والرسائل.",
          "البيانات التشغيلية اللازمة لتقديم الخدمة: جلسات تسجيل الدخول (عبر Clerk) وأعداد التنزيلات المجمّعة. لا نخزّن عناوين IP أو بصمات الأجهزة لأغراض التحليل.",
        ],
      },
      {
        heading: "التحليلات والتتبع",
        body: [
          "نستخدم Plausible Analytics، وهي خدمة بلا ملفات تعريف ارتباط ولا تجمع بيانات شخصية — لا تتبّع بين المواقع ولا ملفات تعريف إعلانية. لا توجد وحدات بكسل إعلانية أو لتتبع الشبكات الاجتماعية من أطراف ثالثة.",
          "نضع ملفات تعريف الارتباط الأساسية فقط (جلسة تسجيل دخولك، واللغة، واختيارك بشأن ملفات تعريف الارتباط).",
        ],
      },
      {
        heading: "كيف نستخدم بياناتك",
        body: [
          "لتشغيل المنصة: عرض ملفك الشخصي ومحتواك، وإيصال التعليقات والرسائل، وإرسال إشعارات الخدمة التي لم تقم بإيقافها.",
          "نستند إلى موافقتك في رسائل الإشعارات الاختيارية (ويمكنك إيقافها في أي وقت)، وإلى المصلحة المشروعة في التشغيل الأساسي للخدمة.",
        ],
      },
      {
        heading: "من يعالج بياناتك",
        body: [
          "نستعين بمعالجين موثوقين فقط لتشغيل الخدمة: Clerk (تسجيل الدخول) وSanity (المحتوى) ومزوّد قاعدة بيانات (Neon/Postgres) وCloudflare R2 (الملفات) وAlgolia (البحث) وResend (البريد) وVercel (الاستضافة). ويعالج كل منهم البيانات وفق تعليماتنا فقط.",
        ],
      },
      {
        heading: "حقوقك",
        body: [
          "يمكنك الوصول إلى جميع بياناتك وتنزيلها في أي وقت (الحساب ← تصدير)، وتصحيحها (ملفك الشخصي قابل للتعديل)، وحذف حسابك — وهو ما يمحو بياناتك الشخصية وتعليقاتك ورسائلك وملفاتك وسجلّك في البحث. تُحتفظ دراسات الحالة المنشورة كمعرفة مجتمعية؛ راسلنا لطلب إزالتها.",
          "يمكنك الاعتراض على المعالجة أو تقييدها أو سحب موافقتك على الرسائل. لممارسة أي حق، استخدم أدوات التطبيق أو راسلنا على " + CONTACT + ".",
        ],
      },
      {
        heading: "الاحتفاظ بالبيانات",
        body: [
          "نحتفظ ببياناتك ما دام حسابك نشطًا. وعند الحذف تُمحى بياناتك سريعًا. وقد نحتفظ بأعداد مجمّعة لا تحدد الهوية.",
        ],
      },
      {
        heading: "التواصل",
        body: ["للأسئلة حول بياناتك: " + CONTACT + "."],
      },
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
      { heading: "Tu cuenta", body: ["Eres responsable de tu cuenta y de mantenerla segura. Debes poder usar el servicio conforme a la ley aplicable."] },
      { heading: "Tu contenido", body: ["Conservas la propiedad del contenido que creas. Al publicarlo, nos otorgas una licencia limitada para mostrarlo y distribuirlo dentro del Hub para que la comunidad pueda verlo. Puedes eliminar tu contenido; los estudios de caso publicados pueden conservarse como conocimiento comunitario (contáctanos para su retirada)."] },
      { heading: "Conducta en la comunidad", body: ["Este es un espacio para una comunidad vulnerable y orientada a la investigación. Sé respetuoso/a. No se permiten el acoso, el contenido de odio ni las conductas dañinas, y pueden ser retirados. Los comentarios pueden moderarse; el contenido claramente dañino se bloquea."] },
      { heading: "Privacidad", body: ["Tu uso también se rige por nuestra Política de Privacidad. No te rastreamos de forma invasiva y te damos control sobre tus datos."] },
      { heading: "Responsabilidad", body: ["El servicio se ofrece tal cual. En la medida permitida por la ley, limitamos nuestra responsabilidad, pero nada de lo aquí escrito elimina los derechos que te asisten como consumidor/a o titular de datos."] },
      { heading: "Cambios", body: ["Podemos actualizar estos términos; indicaremos la fecha de la última versión. El uso continuado implica la aceptación de los términos vigentes."] },
      { heading: "Contacto", body: ["Preguntas: " + CONTACT + "."] },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    updated: UPDATED,
    intro: "Ces conditions régissent votre utilisation de Connecting Climate Minds et sont rédigées pour être équitables : vous conservez la propriété de ce que vous créez et nous ne demandons que le nécessaire.",
    sections: [
      { heading: "Votre compte", body: ["Vous êtes responsable de votre compte et de sa sécurité. Vous devez être en droit d'utiliser le service selon la loi applicable."] },
      { heading: "Votre contenu", body: ["Vous conservez la propriété du contenu que vous créez. En le publiant, vous nous accordez une licence limitée pour l'afficher et le diffuser au sein du Hub afin que la communauté puisse le voir. Vous pouvez supprimer votre contenu ; les études de cas publiées peuvent être conservées comme savoir communautaire (contactez-nous pour leur retrait)."] },
      { heading: "Conduite dans la communauté", body: ["C'est un espace destiné à une communauté vulnérable et axée sur la recherche. Soyez respectueux·se. Le harcèlement, les contenus haineux et les comportements nuisibles sont interdits et peuvent être retirés. Les commentaires peuvent être modérés ; les contenus clairement nuisibles sont bloqués."] },
      { heading: "Confidentialité", body: ["Votre utilisation est également régie par notre Politique de confidentialité. Nous ne vous suivons pas de manière invasive et vous gardez le contrôle de vos données."] },
      { heading: "Responsabilité", body: ["Le service est fourni tel quel. Dans la mesure permise par la loi, nous limitons notre responsabilité — mais rien ici ne supprime vos droits de consommateur·rice ou de personne concernée."] },
      { heading: "Modifications", body: ["Nous pouvons mettre à jour ces conditions ; nous indiquerons la date de la dernière version. La poursuite de l'utilisation vaut acceptation des conditions en vigueur."] },
      { heading: "Contact", body: ["Questions : " + CONTACT + "."] },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    updated: UPDATED,
    intro: "تحكم هذه الشروط استخدامك لـ Connecting Climate Minds، وقد صيغت لتكون منصفة لك: تحتفظ بملكية ما تنشئه، ونطلب فقط ما يلزم لإدارة المجتمع.",
    sections: [
      { heading: "حسابك", body: ["أنت مسؤول عن حسابك وعن الحفاظ على أمانه. ويجب أن يكون استخدامك للخدمة جائزًا بموجب القانون المعمول به."] },
      { heading: "محتواك", body: ["تحتفظ بملكية المحتوى الذي تنشئه. وبنشره تمنحنا ترخيصًا محدودًا لعرضه وتوزيعه داخل المنصة ليراه المجتمع. يمكنك حذف محتواك؛ وقد تُحتفظ دراسات الحالة المنشورة كمعرفة مجتمعية (راسلنا لطلب الإزالة)."] },
      { heading: "السلوك في المجتمع", body: ["هذه مساحة لمجتمع بحثي قد يضم أشخاصًا في أوضاع هشة. كن محترمًا. لا يُسمح بالمضايقة أو المحتوى الكاره أو السلوك الضار، وقد تتم إزالته. قد تخضع التعليقات للمراجعة؛ ويُحجب المحتوى الضار بوضوح."] },
      { heading: "الخصوصية", body: ["يخضع استخدامك أيضًا لسياسة الخصوصية الخاصة بنا. لا نتتبعك بشكل تطفلي ونمنحك التحكم في بياناتك."] },
      { heading: "المسؤولية", body: ["تُقدَّم الخدمة كما هي. وفي الحدود التي يسمح بها القانون نحدّ من مسؤوليتنا — لكن لا شيء هنا يلغي حقوقك كمستهلك أو كصاحب بيانات."] },
      { heading: "التغييرات", body: ["قد نحدّث هذه الشروط؛ وسنبيّن تاريخ أحدث نسخة. استمرار الاستخدام يعني قبول الشروط السارية."] },
      { heading: "التواصل", body: ["للأسئلة: " + CONTACT + "."] },
    ],
  },
};
