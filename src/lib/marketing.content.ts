import {
  BarChart3,
  CheckCircle2,
  Code2,
  Database,
  Eye,
  FileText,
  Globe2,
  Layers3,
  Lock,
  MessageSquare,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import type {
  MarketingFaq,
  MarketingIconFeature,
  MarketingIntegrationCategory,
  MarketingMethodologyPhase,
  MarketingNavItem,
  MarketingPricingPlan,
  MarketingStat,
} from "@/lib/marketing.types";

export const marketingNavItems = [
  { label: "Inicio", href: "/" },
  { label: "Seguridad", href: "/security" },
  { label: "Metodologia", href: "/methodology" },
  { label: "Integraciones", href: "/integrations" },
  { label: "Logistica", href: "/solutions/logistics" },
  { label: "Precios", href: "/pricing" },
  { label: "Developers", href: "/developers" },
] as const satisfies readonly MarketingNavItem[];

export type MarketingNavHref = (typeof marketingNavItems)[number]["href"];

const navItemByHref: {
  [K in MarketingNavHref]: Extract<(typeof marketingNavItems)[number], { href: K }>;
} = {
  "/": marketingNavItems[0],
  "/security": marketingNavItems[1],
  "/methodology": marketingNavItems[2],
  "/integrations": marketingNavItems[3],
  "/solutions/logistics": marketingNavItems[4],
  "/pricing": marketingNavItems[5],
  "/developers": marketingNavItems[6],
};

export const marketingMobileNavOrder = [
  "/",
  "/pricing",
  "/security",
  "/integrations",
  "/solutions/logistics",
  "/methodology",
  "/developers",
] as const satisfies readonly MarketingNavHref[];

export const marketingMobileNavItems = marketingMobileNavOrder.map((href) => navItemByHref[href]);

export const homeStats = [
  { value: "2.4k+", label: "equipos activos" },
  { value: "18k+", label: "tenants operando" },
  { value: "99.95%", label: "uptime mensual" },
] as const satisfies readonly MarketingStat[];

export const homeClientMarks = [
  "ORBIT OPS",
  "ATLAS CRM",
  "NORTE HR",
  "PIVOT BOARD",
  "VECTOR CLOUD",
] as const;

export const homeCapabilityCards = [
  {
    title: "Contrato primero",
    description:
      "Cada decision de UI nace desde integracion por contrato y control de cambios entre backend y frontend.",
    icon: ShieldCheck,
  },
  {
    title: "Sectores verticales",
    description:
      "Modulos optimizados para logistica y operaciones, integrados con trazabilidad avanzada.",
    icon: Layers3,
  },
  {
    title: "Escala multitenant",
    description:
      "Inventory, CRM y HR se despliegan por modulo y plan con aislamiento total de datos.",
    icon: Globe2,
  },
] as const satisfies readonly MarketingIconFeature[];

export const homeFaqs = [
  {
    question: "Que incluye esta etapa inicial?",
    answer:
      "Landing de producto con estados claros de interfaz y arquitectura lista para conectar contratos API.",
  },
  {
    question: "Por que no hay integracion real de endpoints todavia?",
    answer:
      "La integracion real se gobierna desde OpenAPI local sincronizado con backend y cliente HTTP tipado.",
  },
  {
    question: "Como se conecta luego la sesion browser?",
    answer:
      "La siguiente etapa conecta login, refresh y logout con credentials include y un solo retry de refresh.",
  },
  {
    question: "Que evita fuga de datos entre tenants?",
    answer:
      "Query keys con tenantId, invalidacion en tenant switch y limpieza total de cache en logout.",
  },
] as const satisfies readonly MarketingFaq[];

export const securityFeatures = [
  {
    title: "Cifrado AES-256",
    description: "Datos cifrados en reposo y en transito con protocolos de grado bancario.",
    icon: Lock,
  },
  {
    title: "Aislamiento de tenants",
    description: "Cada organizacion opera en un entorno logico separado con privacidad estricta.",
    icon: Eye,
  },
  {
    title: "Cumplimiento SOC2 y GDPR",
    description: "Auditorias anuales para asegurar estandares altos de gobernanza y privacidad.",
    icon: FileText,
  },
  {
    title: "Monitoreo 24/7",
    description: "Deteccion de intrusiones y respuesta automatizada ante incidentes criticos.",
    icon: ShieldCheck,
  },
] as const satisfies readonly MarketingIconFeature[];

export const securityCompliances = [
  "SOC 2 Type II Certified",
  "GDPR Compliance",
  "ISO/IEC 27001",
  "HIPAA Ready",
  "PCI-DSS Level 1",
  "CCPA Compliant",
] as const;

export const securityFaqs = [
  {
    question: "Donde se almacenan mis datos?",
    answer: "Soberania de datos con regiones AWS en US, EU y Latam.",
  },
  {
    question: "Quien tiene acceso a la informacion?",
    answer: "Solo personal autorizado bajo protocolo zero trust y MFA obligatorio.",
  },
  {
    question: "Como manejan brechas de seguridad?",
    answer: "Equipo de respuesta 24/7 con politica de notificacion inmediata.",
  },
] as const satisfies readonly MarketingFaq[];

export const pricingPlans = [
  {
    name: "Starter",
    price: 49,
    description: "Ideal para equipos pequenos que inician transformacion digital.",
    features: ["Hasta 5 usuarios", "Dashboard base", "Soporte por email", "Seguridad estandar"],
    cta: "Comenzar gratis",
    popular: false,
  },
  {
    name: "Business Pro",
    price: 149,
    description: "Plan completo para empresas en crecimiento con necesidad de escala.",
    features: ["Usuarios ilimitados", "Analitica predictiva", "Soporte 24/7", "Cumplimiento SOC2"],
    cta: "Probar Business Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Infraestructura dedicada y gobernanza completa para corporaciones.",
    features: ["Soberania de datos", "SSO personalizado", "Account manager", "SLA 99.99%"],
    cta: "Hablar con ventas",
    popular: false,
  },
] as const satisfies readonly MarketingPricingPlan[];

export const integrationCategories = [
  {
    name: "Infraestructura cloud",
    icon: Server,
    integrations: [
      { name: "AWS", acronym: "AW", description: "Almacenamiento y computacion escalable." },
      { name: "Azure", acronym: "AZ", description: "Servicios cloud empresariales de Microsoft." },
      {
        name: "Google Cloud",
        acronym: "GC",
        description: "Infraestructura de datos e IA avanzada.",
      },
    ],
  },
  {
    name: "Productividad y CRM",
    icon: MessageSquare,
    integrations: [
      { name: "Slack", acronym: "SL", description: "Notificaciones operativas en tiempo real." },
      {
        name: "Salesforce",
        acronym: "SF",
        description: "Sincronizacion bidireccional de clientes.",
      },
      {
        name: "Microsoft 365",
        acronym: "M3",
        description: "Integracion nativa con Excel y Teams.",
      },
    ],
  },
  {
    name: "Operaciones y datos",
    icon: Database,
    integrations: [
      { name: "SAP S/4HANA", acronym: "SA", description: "Conector para procesos core de operacion." },
      { name: "Snowflake", acronym: "SN", description: "Data warehouse para analitica avanzada." },
      { name: "Datadog", acronym: "DD", description: "Monitoreo y observabilidad de sistema." },
    ],
  },
] as const satisfies readonly MarketingIntegrationCategory[];

export const developerFeatures = [
  {
    title: "Documentacion OpenAPI 3.1",
    description: "Contratos API validados con esquemas tipados y control de cambios.",
    icon: Code2,
  },
  {
    title: "Trazabilidad avanzada",
    description: "traceId unificado para depuracion distribuida en flujos criticos.",
    icon: Terminal,
  },
  {
    title: "Seguridad por diseno",
    description: "Controles OWASP y proteccion nativa contra CSRF y XSS.",
    icon: Lock,
  },
  {
    title: "Arquitectura cloud-native",
    description: "Escalabilidad para operaciones enterprise en nube hibrida.",
    icon: Globe2,
  },
] as const satisfies readonly MarketingIconFeature[];

export const logisticsFeatures = [
  {
    title: "Optimizacion de rutas",
    description: "Algoritmos para reducir tiempos de entrega y costos operativos.",
    icon: Truck,
  },
  {
    title: "Logistica global",
    description: "Gestion unificada de almacenes en multiples regiones.",
    icon: Globe2,
  },
  {
    title: "Seguridad de carga",
    description: "Monitoreo continuo y auditoria automatica de integridad de inventario.",
    icon: ShieldCheck,
  },
  {
    title: "Control de stock",
    description: "Sincronizacion en tiempo real entre demanda y niveles de existencias.",
    icon: Database,
  },
] as const satisfies readonly MarketingIconFeature[];

export const methodologyPhases = [
  {
    phase: "01",
    title: "Auditoria y alineacion",
    subtitle: "Discovery and Strategy",
    businessValue: "Mapeo de procesos criticos y objetivos de ROI para la organizacion.",
    technicalMilestones: [
      "Definicion de arquitectura logica",
      "Matriz inicial de permisos RBAC",
      "Analisis de entornos legacy",
    ],
    icon: Search,
    toneClassName: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  },
  {
    phase: "02",
    title: "Integracion de infraestructura",
    subtitle: "Contract-First Connection",
    businessValue: "Conexion segura de sistemas con contratos API y trazabilidad completa.",
    technicalMilestones: [
      "Validacion de esquemas OpenAPI",
      "Configuracion de client SDK con traceId",
      "Activacion de guardas CSRF",
    ],
    icon: Zap,
    toneClassName: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300",
  },
  {
    phase: "03",
    title: "Migracion de datos",
    subtitle: "Trust First Data Move",
    businessValue: "Traslado seguro de informacion historica bajo soberania de datos.",
    technicalMilestones: [
      "ETL con cifrado AES-256",
      "Verificacion de aislamiento por tenant",
      "Auditoria de integridad de datos",
    ],
    icon: Database,
    toneClassName: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    phase: "04",
    title: "Despliegue y capacitacion",
    subtitle: "Enterprise Onboarding",
    businessValue: "Activacion del portal corporativo y onboarding operativo acelerado.",
    technicalMilestones: [
      "Rollout de UI de tenant",
      "Dashboard de operacion",
      "Training de administradores IT",
    ],
    icon: Users,
    toneClassName: "bg-blue-700 text-white",
  },
  {
    phase: "05",
    title: "Gobernanza y escala",
    subtitle: "Continuous Success",
    businessValue: "Monitoreo de adopcion y expansion modular segun demanda del negocio.",
    technicalMilestones: [
      "Auditoria de logs inmutables",
      "Activacion CRM e Inventory",
      "Roadmap de crecimiento trimestral",
    ],
    icon: TrendingUp,
    toneClassName: "bg-slate-900 text-white",
  },
] as const satisfies readonly MarketingMethodologyPhase[];

export const methodologyHighlights = [
  { value: "14 dias", label: "Promedio de go-live" },
  { value: "0.0%", label: "Perdida de datos en migracion" },
  { value: "24/7", label: "Soporte IT dedicado" },
] as const satisfies readonly MarketingStat[];

export const homeKpis = [
  {
    title: "Auth health",
    status: "stable",
    progressLabel: "refresh recovery target",
    progressValue: "84%",
  },
  {
    title: "Tenant isolation checks",
    status: "ready",
    tags: ["cache scoped", "logout cleanup", "rbac guard", "traceId surfaced"],
  },
] as const;

export const homeTechPillars = [
  {
    title: "Estado y cache por tenant",
    description: "Aislamiento de estado para evitar fugas cross-tenant.",
    icon: Database,
  },
  {
    title: "Manejo de errores por codigo",
    description: "Decisiones de UI basadas en error.code y traceId.",
    icon: CheckCircle2,
  },
  {
    title: "Delivery continuo",
    description: "Flujos de QA con tests y smoke checks de rutas criticas.",
    icon: BarChart3,
  },
] as const satisfies readonly MarketingIconFeature[];
