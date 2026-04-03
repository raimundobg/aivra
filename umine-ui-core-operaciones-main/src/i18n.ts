import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import localforage from 'localforage';

// Translation files
const resources = {
    en: {
        translation: {
            "nav": {
                "home": "Home",
                "po": "PO List",
                "design_system_label": "Operations CORE",
                "configure": "Configure",
                "login_google": "Login with Google",
                "user": "User",
                "notifications": "Notifications",
                "select_language": "Select Language",
                "customers": "Customers"
            },
            "charts": {
                "weekly_adoption": "Weekly Adoption",
                "weekly_adoption_desc": "Daily active users using glass components.",
                "performance_backend": "Backend Performance",
                "performance_backend_desc": "Average response time for AI theme generation.",
                "platform_distribution": "Platform Distribution",
                "platform_distribution_desc": "Types of devices and browsers detected.",
                "data_point": "Data Point",
                "months": {
                    "jan": "Jan",
                    "feb": "Feb",
                    "mar": "Mar",
                    "apr": "Apr",
                    "may": "May",
                    "jun": "Jun"
                },
                "categories": {
                    "premium": "Premium",
                    "standard": "Standard",
                    "free": "Free"
                }
            },
            "dashboard": {
                "general_title": "General Overview",
                "po_title": "PO Dashboard",
                "check_new": "Check",
                "view_ocs": "View OCs",
                "summary": "Core operations and business metrics.",
                "total_po": "Total Orders",
                "pending_po": "Pending",
                "completed_po": "Completed",
                "top_clients": "Top Clients",
                "recent_activity": "Recent Activity",
                "active_users": "Active Users",
                "global_report": "Global Report",
                "revenue_est": "Revenue (Est.)",
                "customer_growth": "Customer Growth",
                "new_companies_vs_prev": "New companies vs previous year",
                "view_all": "View All",
                "companies": "Companies",
                "core_operations_title": "Operations Core",
                "core_operations_desc": "Access the specific dashboard for purchase orders and extraction management.",

                "activity": {
                    "action_approved": "approved",
                    "action_extracted": "extracted",
                    "action_created": "created new company:",
                    "time_min": "min ago",
                    "time_hour": "hour ago"
                },
                "monthly_volume": "Monthly Volume",
                "monthly_volume_desc": "Orders extracted per month",
                "status_distribution": "Status Distribution",
                "status_distribution_desc": "Current approval status",
                "extraction_alerts": "Extraction Alerts",
                "critical": "Critical",
                "no_discrepancies": "No discrepancies detected.",
                "view": "View",
                "active": "Active",
                "on_hold": "On Hold",
                "company": "Company",
                "courses_po": "Courses / PO",
                "billing": "Billing",
                "check_success": "Orders verified successfully",
                "check_error": "Error verifying new orders"
            },
            "po_list": {
                "title": "Purchase Orders",
                "order_no": "Order #",
                "client": "Client",
                "course": "Course",
                "sence": "SENCE Code",
                "status": "Status",
                "date": "Date",
                "total": "Total",
                "actions": "Actions",
                "view_detail": "View Detail",
                "objections": "Objections",
                "management_title": "PO Management & Tracking",
                "management_subtitle": "Management and tracking of purchase orders / SENCE courses.",
                "filter": "Filter",
                "observations": "Observations",
                "status_success": "SUCCESS",
                "status_pending": "PENDING",
                "status_duplicate": "DUPLICATE"
            },
            "po_detail": {
                "course_info": "Course Information",
                "otic_info": "OTIC Information",
                "financial_info": "Financial Summary",
                "email_source": "Source Email",
                "attachments": "Attachments",
                "students": "Students",
                "header_objections": "Extraction Objections",
                "student_objections": "Student Objections",
                "init_date": "Start Date",
                "end_date": "End Date",
                "tramo_sence": "SENCE Tramo",
                "otic_name": "OTIC Name",
                "otic_rol": "OTIC ROL",
                "dni": "DNI / RUT",
                "student_name": "Name",
                "value": "Value",
                "email": "Email",
                "from": "From",
                "subject": "Subject",
                "received": "Received",
                "no_students": "No students found in this order."
            },
            "swiper": {
                "slide1_badge": "Umine CINEMA",
                "slide1_title": "Living <br /> Performance",
                "slide1_desc": "Fluid interfaces reflecting cinematic movement. The Umine engine optimizes every frame.",
                "slide1_btn": "Explore Engine",
                "slide2_title": "Glass Layers",
                "slide2_desc": "Umine's depth is felt. Massive organic shapes divide the canvas to guide focus.",
                "slide3_title": "TOTAL VELOCITY",
                "slide3_desc": "Immersive beauty without compromise. High-speed Umine rendering for premium experiences.",
                "slide3_btn": "View Benchmarks",
                "hover": "Hover"
            },
            "common": {
                "loading": "Loading...",
                "save": "Save",
                "no_results": "No results found.",
                "cancel": "Cancel",
                "back": "Back",
                "continue": "Continue",
                "send": "Send",
                "language": "Language",
                "exclusive_access": "Login with your credentials",
                "login_message": "Log in to operate your business with smart tools",
                "login_google": "Login with Google",
                "preferences": "Preferences",
                "logout": "Logout",
                "light_mode": "Light Mode",
                "dark_mode": "Dark Mode",
                "mode": "Mode",
                "success": "Success",
                "info": "Info",
                "warning": "Warning",
                "error": "Error",
                "brand_label": "Brand",
                "edit": "Edit",
                "accent_label": "Accent",
                "copied": "Copied",
                "delete": "Delete",
                "history": "History",
                "notifications": "Notifications",
                "select_language": "Select Language",
                "select_language_description": "Choose your preferred language for the operations dashboard.",
                "settings": {
                    "title": "Configuration"
                }
            },
            "colors": {
                "title": "Color Palette",
                "subtitle": "Complete design system with semantic tokens that automatically adapt to light and dark modes.",
                "backgrounds": "Backgrounds",
                "foregrounds": "Foregrounds (Text)",
                "brand_colors": "Brand Colors",
                "system_buttons": "System Buttons",
                "borders": "Borders",
                "gradients": "Gradients",
                "tags_badges": "Tags and Badges",
                "raw_palette": "Base Palette (Raw Tokens)",
                "bg_canvas": "Canvas",
                "bg_canvas_desc": "Main application background",
                "bg_surface": "Surface",
                "bg_surface_desc": "Surfaces with glassmorphism",
                "bg_muted": "Muted",
                "bg_muted_desc": "Secondary backgrounds",
                "fg_default": "Default",
                "fg_default_desc": "Primary text",
                "fg_muted": "Muted",
                "fg_muted_desc": "Secondary text",
                "fg_accent": "Accent",
                "fg_accent_desc": "Accent text",
                "fg_inverted": "Inverted",
                "fg_inverted_desc": "Inverted text",
                "fg_brand": "Brand",
                "fg_brand_desc": "Brand text",
                "brand_primary": "Primary",
                "brand_primary_desc": "Green primary color",
                "brand_secondary": "Secondary",
                "brand_secondary_desc": "Purple secondary color",
                "brand_accent": "Accent",
                "brand_accent_desc": "Cyan accent color",
                "button_primary_normal": "Primary Button - Normal",
                "button_primary_hover": "Primary Button - Hover",
                "border_subtle": "Border Subtle",
                "gradient_glass": "Glass Gradient",
                "green_system": "Green (System)",
                "cyan_umine": "Cyan (Umine)",
                "slate_neutrals": "Slate (Neutrals)"
            },
            "landing": {
                "title": "Smart",
                "subtitle_highlight": "Operations Core",
                "subtitle": "AI applied to business process to performance communications, integrations and technology - ready to be used by people and agents."
            },
            "overview": {
                "hero": "A minimalist and accessible design system focused on visual depth through Glassmorphism. Designed to transmit a 'Premium Access' feeling under the Umine identity.",
                "minimalism": "Minimalism",
                "minimalism_desc": "Reduction of corporate visual noise.",
                "depth": "Depth",
                "depth_desc": "Semantic layers for hierarchy.",
                "accessibility": "Accessibility",
                "accessibility_desc": "Umine adapted contrast.",
                "interactivity": "Advanced Interactivity",
                "buttons": "System Buttons",
                "principal": "Principal",
                "secondary": "Secondary",
                "data_viz": "Multimodal Data Visualization",
                "data_viz_desc": "Different visual styles to represent complex info flows.",
                "ready": "Ready for more?",
                "ready_desc": "Explore the system to see how AI can power your operations.",
                "access_builder": "Get Started"
            },
            "typography": {
                "title": "Typography",
                "subtitle": "We use 'Outfit' for headers with personality and 'Inter' for unbeatable legibility in complex interfaces.",
                "body_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In minimalist design, whitespace is an active element, not passive. It allows the eyes to rest and process information."
            },
            "icons": {
                "title": "Icon Gallery",
                "subtitle": "We use Lucide Icons for their clean geometry and consistent weight. All icons adapt perfectly to our light and dark themes.",
                "cat_nav": "Navigation & Interaction",
                "cat_action": "Action & Status",
                "cat_media": "Media & Branding",
                "cat_design": "Design & Visuals",
                "copy_desc": "Code for icon {{name}} copied."
            },
            "components": {
                "title": "Component Library",
                "subtitle": "Our Chakra UI v3 component library, styled with the UMINE visual language. Designed for accessibility, performance, and a premium 'glass' aesthetic.",
                "showcase": {
                    "badges_status": "Badges & Status",
                    "new_release": "New Release",
                    "under_review": "Under Review",
                    "system_active": "System Active",
                    "syncing": "Syncing",
                    "tabs_cats": "Tabs & Categorization",
                    "overview": "Overview",
                    "history": "History",
                    "overview_desc": "General project information and key metrics.",
                    "settings_desc": "System configuration.",
                    "history_desc": "Change history.",
                    "acc_faq": "Accordions & FAQ",
                    "glass_q": "How does Glassmorphism work?",
                    "glass_a": "It uses a combination of reduced opacity, background blur (backdrop-blur), and contrasted borders to simulate a frosted glass surface.",
                    "display_config": "Display Configuration",
                    "display_config_desc": "You can adjust blur intensity and border brightness using semantic tokens.",
                    "inputs_forms": "Inputs & Forms",
                    "email_label": "Email Address",
                    "bio_label": "Profile Bio",
                    "bio_placeholder": "Tell us about yourself...",
                    "bio_helper": "Maximum 200 characters.",
                    "sys_progress": "System Progress",
                    "search_shortcut": "Search Shortcut",
                    "up_to_date": "UP TO DATE",
                    "data_tables": "Data Tables",
                    "client": "Client",
                    "status": "Status",
                    "progress": "Progress",
                    "actions": "Actions",
                    "completed": "completed",
                    "processing": "processing",
                    "pending": "pending"
                }
            },
            "ia_modal": {
                "title": "Operations AI",
                "description": "Describe the operational task or query. The system will process and optimize the business flow.",
                "name_label": "Task Name",
                "name_placeholder": "Identify this operation...",
                "text_input_placeholder": "Describe what you need to achieve...",
                "audio_start": "Start Voice Command",
                "audio_stop": "Stop & Process",
                "file_upload": "Upload Document",
                "processing": "Analyzing operational context...",
                "success": "Analysis complete. Optimization applied."
            },
            "glass": {
                "title": "Glassmorphism Effects",
                "subtitle": "The heart of Umine. The frosted glass effect creates contextual separation without blocking the background, allowing for deep and organic hierarchies.",
                "card_title": "Full Glass",
                "card_desc": "This component uses `backdrop-blur-xl` and a semi-transparent border to separate itself from the background in a premium way.",
                "card_btn": "Interact",
                "feat1_title": "Backdrop Blur",
                "feat1_desc": "Softens the background to focus on the main content without losing context.",
                "feat2_title": "Vibrant Borders",
                "feat2_desc": "Crystalline borders that capture light and define component shape.",
                "feat3_title": "Dynamic Shadows",
                "feat3_desc": "Soft shadows that respect the system's transparency and depth."
            },
            "agent": {
                "title": "Agent Prompt",
                "subtitle": "Copy this prompt and attach it to your programmer agent to ensure that any future development complies with these standards.",
                "copy_btn": "Copy Prompt",
                "footer": "Copy this block and paste it into your Agent's system settings.",
                "prompt_content": "**CORE DESIGN SYSTEM - AGENT INSTRUCTIONS**\n\nACT AS: Expert UI/UX Designer & Frontend Developer specializing in \"Glassmorphism\" and \"Premium Access\" interfaces.\n\nCONTEXT: You are building interfaces for a high-end platform. The brand is defined by a minimalist, sophisticated style, with intensive use of Glassmorphism (glass effect), native Light/Dark Mode support, and clean typography.\n\nCOMPULSORY DESIGN RULES:\n\n1. **Base Colors & Background:**\n   - NEVER use solid flat backgrounds (#FFF or #000). Use very subtle gradients or blurred color blobs in the background for the glass effect to work.\n   - Light Mode: Slate-50 background, Slate-800 text.\n   - Dark Mode: Slate-900 background, Slate-100 text.\n   - Primary: Use the specific primary brand color for main actions.\n\n2. **Glassmorphism (The standard):**\n   - All containers (cards, sidebar, modals) must be translucent.\n   - CSS Class (Chakra UI) Light: `bg: \"whiteAlpha.700\", backdropBlur: \"lg\", border: \"1px solid\", borderColor: \"whiteAlpha.500\", boxShadow: \"sm\"`\n   - CSS Class (Chakra UI) Dark: `bg: \"blackAlpha.600\", backdropBlur: \"xl\", border: \"1px solid\", borderColor: \"whiteAlpha.100\", boxShadow: \"2xl\"`\n   - Borders: Always use 1px borders with low opacity to define boundaries.\n\n3. **Typography:**\n   - Headings: 'Outfit' (Google Fonts) - Weights 600/700. Tracking -0.02em.\n   - Body: 'Inter' (Google Fonts) - Weights 300/400. High legibility.\n\n4. **Interaction:**\n   - Hover states: Don't just change the color. Add a slight translation (`-translate-y-1`) and increase the shadow.\n   - Transitions: `duration-300 ease-out` for \"Premium\" smoothness.\n\n5. **Graphics & Data:**\n   - DO NOT use SVG for complex graphics, use Chart.js or Canvas.\n   - Graphics should not have a solid white background; they should be transparent to integrate into the glass cards.\n\n6. **Accessibility:**\n   - Ensure sufficient contrast in text over blurred backgrounds.\n   - Use ARIA labels on interactive components.\n\nOUTPUT FORMAT:\n- Siempre genera código Chakra UI v3 usando tokens del sistema (bg.surface, border.subtle, shadow.glass)."
            },
            "playground": {
                "title": "Component Playground",
                "subtitle": "Explore and copy the Chakra UI version of our base components.",
                "code_title": "Chakra UI v3 Code",
                "code_desc": "Production-ready snippets with Umine tokens.",
                "copy_btn": "Copy Snippet",
                "toast_desc": "Chakra UI v3 code copied to clipboard.",
                "examples": {
                    "GlassCard": {
                        "label": "Glass Card",
                        "desc": "Base container with frosted glass effect.",
                        "content": "Card content with premium glassmorphism effect."
                    },
                    "BadgesStatus": {
                        "label": "Badges & Status",
                        "desc": "Status indicators and categorizing labels.",
                        "active": "System Active"
                    },
                    "PremiumTabs": {
                        "label": "Premium Tabs",
                        "desc": "Tab system for internal navigation.",
                        "overview_desc": "General project information."
                    },
                    "Accordion": {
                        "label": "FAQ Accordion",
                        "desc": "Dropdown list for collapsible content.",
                        "question": "How does it work?",
                        "answer": "Uses a combination of reduced opacity and background blur."
                    },
                    "GlassInput": {
                        "label": "Glass Input",
                        "desc": "Douglas' UI kit includes complex inputs."
                    },
                    "DataTable": {
                        "label": "Data Tables",
                        "desc": "Styled table for record visualization."
                    },
                    "ProgressKbd": {
                        "label": "Kbd & Progress",
                        "desc": "Keyboard shortcuts and loading bars."
                    }
                }
            },
            "notifications": {
                "success_title": "Action Successful",
                "error_title": "Error Detected",
                "warning_title": "Attention Required",
                "operation_success": "Operation '{{name}}' completed successfully.",
                "operation_error": "Failed to complete operation. Please try again later.",
                "operation_warning": "Operation completed with warnings.",
                "item_deleted": "Item deleted successfully."
            },
            "notifications_page": {
                "title": "Notifications",
                "subtitle": "Inform and guide the user without interrupting the flow. Our notification system standardizes feedback across standard alerts, toasts, and contextual banners.",
                "intro_title": "Conceptual Framework",
                "intro_desc": "Notifications are semantic signals. Every message must have a clear purpose: confirming an action, warning about a risk, or reporting a system state. They follow the 'Umine' principle: visible but not intrusive.",
                "types": {
                    "title": "Semantic Types",
                    "success": "Success",
                    "success_desc": "Use for completed actions (e.g., 'Operation completed'). Colors gravitate towards emerald and mint.",
                    "info": "Information",
                    "info_desc": "Use for non-blocking neutral updates. Blue and cyan tones under glass effect.",
                    "warning": "Warning",
                    "warning_desc": "Use for actions that require attention but aren't errors. Amber and amber-gold palette.",
                    "error": "Error",
                    "error_desc": "Use for failures or blocked actions. Crimson and rose tones with high contrast.",
                    "loading": "Loading",
                    "loading_desc": "Use for asynchronous processes. Subtle animations with system progress bars."
                },
                "components": {
                    "title": "Core Components",
                    "toast_title": "Toast Notifications",
                    "toast_desc": "Ephemeral messages that appear in the bottom-right corner. Ideal for action feedback.",
                    "alert_title": "Inline Alerts",
                    "alert_desc": "Persistent components within the layout. Used for page-level or section-level context.",
                    "banner_title": "Banner Notifications",
                    "banner_desc": "Full-width alerts that demand immediate attention at the top of the viewport or container."
                },
                "ux_rules": {
                    "title": "Behavior & UX Rules",
                    "duration_label": "Recommended Duration",
                    "timeout_success": "Success: 3-5 seconds",
                    "timeout_error": "Error: Persistent or 10+ seconds",
                    "stacking_label": "Stacking",
                    "stacking_desc": "Maximum 3 visible toasts at a time. Older messages are dismissed to make room.",
                    "accessibility_label": "Accessibility",
                    "accessibility_desc": "All notifications include ARIA alerts and appropriate contrast ratios for glass surfaces."
                },
                "playground": {
                    "title": "Notification Playground",
                    "show_success": "Trigger Success Toast",
                    "show_info": "Trigger Info Toast",
                    "show_warning": "Trigger Warning Toast",
                    "show_error": "Trigger Error Toast",
                    "show_loading": "Trigger Loading Toast"
                }
            },
            "crm": {
                "add_customer": "Add Customer",
                "edit_customer": "Edit Customer",
                "customer_details": "Customer Details",
                "basic_info": "Basic Information",
                "management_info": "Management Info",
                "platform_info": "Platform & Access",
                "contact_info": "Primary Contact",
                "fields": {
                    "name": "Customer Name",
                    "industry": "Industry",
                    "status": "Status",
                    "otic": "OTIC",
                    "client_type": "Client Type",
                    "segment": "Segment",
                    "comercial_manager": "Comercial Manager",
                    "comercial_contact": "Comercial Contact",
                    "coordinator_manager": "Coordinator Manager",
                    "coordinator_contact": "Coordinator Contact",
                    "platform_type": "Platform Type",
                    "domain": "Domain / URL",
                    "admin_username": "Admin Username",
                    "password": "Password",
                    "app_name": "App Name",
                    "report_url": "Report URL",
                    "institution_id": "Institution ID",
                    "phone": "Phone",
                    "address": "Address",
                    "website": "Website",
                    "tax_id": "Tax ID / RUT",
                    "email": "Email",
                    "customer_since": "Customer Since",
                    "role": "Position",
                    "contact": "Contact",
                    "reference": "Reference",
                    "amount": "Amount",
                    "date": "Date",
                    "course": "Course",
                    "account_manager": "Account Manager"
                },
                "industry_labels": {
                    "Retail": "Retail",
                    "Minería": "Mining",
                    "Banca": "Banking",
                    "Bebidas": "Beverages",
                    "Educación": "Education",
                    "Tecnología": "Technology",
                    "Salud": "Health",
                    "Seguros": "Insurance",
                    "Servicios": "Services",
                    "Otro": "Other"
                },
                "status_labels": {
                    "CLIENTE ACTIVO": "Active Customer",
                    "CLIENTE INACTIVO": "Inactive Customer",
                    "DADO DE BAJA": "Terminated",
                    "ALIANZA": "Alliance"
                },
                "client_type_labels": {
                    "Cliente Plataforma": "Platform Client",
                    "Cliente Spot": "Spot Client",
                    "Cliente Contenidos": "Content Client",
                    "Plataforma Bloqueada": "Blocked Platform"
                },
                "platform_type_labels": {
                    "PLATAFORMA PROPIA": "Own Platform",
                    "SIN PLATAFORMA": "No Platform"
                },
                "tabs": {
                    "dashboard": "Dashboard",
                    "contacts": "Directory",
                    "pos": "Purchase Orders",
                    "billing": "Billing",
                    "aliases": "Aliases"
                },
                "headers": {
                    "tax_data": "Tax Data",
                    "billing_channel": "Billing Channel"
                },
                "kpis": {
                    "total_pos": "Total POs",
                    "avg_ticket": "Average Ticket",
                    "active_projects": "Active Projects",
                    "history_chart": "Historical activity chart"
                },
                "billing_info": {
                    "payment_method": "Payment Method",
                    "pending_docs": "Pending Documents"
                },
                "alias_management": {
                    "title": "Alias Management",
                    "subtitle": "Manage alternative names for search patterns",
                    "placeholder": "Add tags (comma separated)",
                    "add_btn": "Add",
                    "no_aliases": "No aliases defined yet."
                },
                "account_manager_modal": {
                    "title": "Account Manager Info",
                    "send_email": "Send Email",
                    "send_whatsapp": "Send WhatsApp",
                    "call": "Call",
                    "close": "Close"
                }
            }
        }
    },
    es: {
        translation: {
            "nav": {
                "home": "Inicio",
                "po": "Listado OCs",
                "design_system_label": "CORE Operaciones",
                "configure": "Configurar",
                "login_google": "Ingresa con Google",
                "user": "Usuario",
                "notifications": "Notificaciones",
                "select_language": "Seleccionar Idioma",
                "customers": "Clientes"
            },
            "charts": {
                "weekly_adoption": "Adopción Semanal",
                "weekly_adoption_desc": "Usuarios activos diarios utilizando componentes de vidrio.",
                "performance_backend": "Rendimiento del Backend",
                "performance_backend_desc": "Tiempo de respuesta promedio para generación de temas IA.",
                "platform_distribution": "Distribución de Plataforma",
                "platform_distribution_desc": "Tipos de dispositivos y navegadores detectados.",
                "data_point": "Punto de Datos",
                "months": {
                    "jan": "Ene",
                    "feb": "Feb",
                    "mar": "Mar",
                    "apr": "Abr",
                    "may": "May",
                    "jun": "Jun"
                },
                "categories": {
                    "premium": "Premium",
                    "standard": "Estándar",
                    "free": "Gratis"
                }
            },
            "dashboard": {
                "general_title": "Vista General",
                "po_title": "Dashboard Compras",
                "check_new": "Chequear",
                "view_ocs": "Ver OCs",
                "summary": "Métricas de negocio y operaciones generales.",
                "total_po": "Total de Ordenes",
                "pending_po": "Pendientes",
                "completed_po": "Completadas",
                "top_clients": "Principales Clientes",
                "recent_activity": "Actividad Reciente",
                "active_users": "Usuarios Activos",
                "global_report": "Reporte Global",
                "revenue_est": "Facturación (Est.)",
                "customer_growth": "Crecimiento de Clientes",
                "new_companies_vs_prev": "Nuevas empresas registradas vs año anterior",
                "view_all": "Ver todos",
                "companies": "Empresas",
                "core_operations_title": "Operaciones Core",
                "core_operations_desc": "Accede al dashboard específico de órdenes de compra y gestión de extracciones.",
                "activity": {
                    "action_approved": "aprobó",
                    "action_extracted": "extrajo",
                    "action_created": "creó nueva empresa:",
                    "time_min": "hace",
                    "time_hour": "hace"
                },
                "monthly_volume": "Volumen Mensual",
                "monthly_volume_desc": "Ordenes extraídas por mes",
                "status_distribution": "Distribución por Estado",
                "status_distribution_desc": "Estado actual de aprobación",
                "extraction_alerts": "Alertas de Extracción",
                "critical": "Críticas",
                "no_discrepancies": "No hay discrepancias detectadas.",
                "view": "Ver",
                "active": "Activo",
                "on_hold": "En Espera",
                "company": "Empresa",
                "courses_po": "Cursos / PO",
                "billing": "Facturación",
                "check_success": "Ordenes verificadas con éxito",
                "check_error": "Error al verificar ordenes nuevas"
            },
            "po_list": {
                "title": "Ordenes de Compra",
                "order_no": "Orden #",
                "client": "Cliente",
                "course": "Curso",
                "sence": "Código SENCE",
                "status": "Estado",
                "date": "Fecha",
                "total": "Total",
                "actions": "Acciones",
                "view_detail": "Ver Detalle",
                "objections": "Objeciones",
                "management_title": "Gestión y Seguimiento de PO",
                "management_subtitle": "Gestión y seguimiento de ordenes de compra / cursos SENCE.",
                "filter": "Filtrar",
                "observations": "Observaciones",
                "status_success": "EXITOSO",
                "status_pending": "PENDIENTE",
                "status_duplicate": "DUPLICADO"
            },
            "po_detail": {
                "course_info": "Información del Curso",
                "otic_info": "Información de la OTIC",
                "financial_info": "Resumen Financiero",
                "email_source": "Correo de Origen",
                "attachments": "Archivos Adjuntos",
                "students": "Listado de Estudiantes",
                "header_objections": "Objeciones de Extracción",
                "student_objections": "Objeciones del Estudiante",
                "init_date": "Inicio Curso",
                "end_date": "Fin Curso",
                "tramo_sence": "Tramo SENCE",
                "otic_name": "Nombre OTIC",
                "otic_rol": "ROL OTIC",
                "dni": "DNI / RUT",
                "student_name": "Nombre",
                "value": "Valor",
                "email": "Correo",
                "from": "De",
                "subject": "Asunto",
                "received": "Recibido",
                "no_students": "No se encontraron estudiantes en esta orden."
            },
            "swiper": {
                "slide1_badge": "Umine CINEMA",
                "slide1_title": "Living <br /> Performance",
                "slide1_desc": "Interfaces fluidas que evocan movimiento cinematográfico. El motor Umine optimiza cada fotograma.",
                "slide1_btn": "Explorar Motor",
                "slide2_title": "Capas de Cristal",
                "slide2_desc": "La profundidad Umine se siente. Masivas formas orgánicas dividen el lienzo para guiar el foco.",
                "slide3_title": "VELOCIDAD TOTAL",
                "slide3_desc": "Belleza inmersiva sin compromisos. Renderizado Umine de alta velocidad para experiencias premium.",
                "slide3_btn": "Ver Benchmarks",
                "hover": "Hover"
            },
            "common": {
                "loading": "Cargando...",
                "save": "Guardar",
                "no_results": "No se encontraron resultados.",
                "cancel": "Cancelar",
                "back": "Volver",
                "continue": "Continuar",
                "send": "Enviar",
                "language": "Idioma",
                "exclusive_access": "Ingresa con tus credenciales",
                "login_message": "Inicia sesión para operar tu negocio con herramientas inteligentes",
                "login_google": "Ingresa con Google",
                "preferences": "Preferencias",
                "logout": "Cerrar Sesión",
                "light_mode": "Modo Claro",
                "dark_mode": "Modo Oscuro",
                "mode": "Modo",
                "success": "Éxito",
                "info": "Info",
                "warning": "Advertencia",
                "error": "Error",
                "brand_label": "Marca",
                "edit": "Editar",
                "accent_label": "Acento",
                "copied": "Copiado",
                "delete": "Eliminar",
                "history": "Historial",
                "notifications": "Notificaciones",
                "select_language": "Seleccione idioma",
                "select_language_description": "Elige tu idioma preferido para el panel de operaciones.",
                "settings": {
                    "title": "Configuración"
                }
            },
            "landing": {
                "title": "Smart",
                "subtitle_highlight": "Operations Core",
                "subtitle": "IA aplicada a procesos de negocio para potenciar comunicaciones, integraciones y tecnología - lista para ser usada por personas y agentes."
            },
            "overview": {
                "hero": "Un sistema de diseño minimalista y accesible centrado en la profundidad visual a través del Glassmorphism. Diseñado para transmitir una sensación 'Premium Access' bajo la identidad Umine.",
                "minimalism": "Minimalismo",
                "minimalism_desc": "Reducción de ruido visual corporativo.",
                "depth": "Profundidad",
                "depth_desc": "Capas semánticas para jerarquía.",
                "accessibility": "Accesibilidad",
                "accessibility_desc": "Contraste Umine adaptado.",
                "interactivity": "Interactividad Avanzada",
                "buttons": "Botones del Sistema",
                "principal": "Principal",
                "secondary": "Secundario",
                "data_viz": "Visualización Multimodal",
                "data_viz_desc": "Diferentes estilos visuales para representar flujos de información complejos.",
                "ready": "¿Listo para más?",
                "ready_desc": "Explora el sistema para ver cómo la IA potencia tus operaciones.",
                "access_builder": "Comenzar"
            },
            "typography": {
                "title": "Tipografía",
                "subtitle": "Utilizamos 'Outfit' para encabezados con personalidad y 'Inter' para una legibilidad inmejorable en interfaces complejas.",
                "body_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. En el diseño minimalista, el espacio en blanco es un elemento activo, no pasivo. Permite que la vista descanse y procese la información."
            },
            "icons": {
                "title": "Galería de Iconos",
                "subtitle": "Utilizamos Lucide Icons por su geometría limpia y peso consistente. Todos los iconos se adaptan perfectamente a nuestros temas claro y oscuro.",
                "cat_nav": "Navegación & Interacción",
                "cat_action": "Acción & Estado",
                "cat_media": "Media & Branding",
                "cat_design": "Diseño & Visuales",
                "copy_desc": "Código para el icono {{name}} copiado."
            },
            "components": {
                "title": "Librería de Componentes",
                "subtitle": "Nuestra biblioteca de componentes Chakra UI v3, estilizada con el lenguaje visual UMINE. Diseñados para accesibilidad, rendimiento y una estética premium 'glass'.",
                "showcase": {
                    "badges_status": "Badges & Status",
                    "new_release": "Nuevo Lanzamiento",
                    "under_review": "En Revisión",
                    "system_active": "Sistema Activo",
                    "syncing": "Sincronizando",
                    "tabs_cats": "Tabs & Categorización",
                    "overview": "Resumen",
                    "history": "Historial",
                    "overview_desc": "Información general del proyecto y métricas clave.",
                    "settings_desc": "Configuración del sistema.",
                    "history_desc": "Historial de cambios.",
                    "acc_faq": "Acordeones & FAQ",
                    "glass_q": "¿Cómo funciona el Glassmorphism?",
                    "glass_a": "Utiliza una combinación de opacidad reducida, desenfoque de fondo (backdrop-blur) y bordes contrastados para simular una superficie de vidrio esmerilado.",
                    "display_config": "Configuración de Pantalla",
                    "display_config_desc": "Puedes ajustar la intensidad del desenfoque y el brillo de los bordes mediante tokens semánticos.",
                    "inputs_forms": "Inputs & Formularios",
                    "email_label": "Correo Electrónico",
                    "bio_label": "Biografía del Perfil",
                    "bio_placeholder": "Cuéntanos sobre ti...",
                    "bio_helper": "Máximo 200 caracteres.",
                    "sys_progress": "Progreso del Sistema",
                    "search_shortcut": "Atajo de Búsqueda",
                    "up_to_date": "ACTUALIZADO",
                    "data_tables": "Tablas de Datos",
                    "client": "Cliente",
                    "status": "Estado",
                    "progress": "Progreso",
                    "actions": "Acciones",
                    "completed": "completado",
                    "processing": "procesando",
                    "pending": "pendiente"
                }
            },
            "ia_modal": {
                "title": "IA de Operaciones",
                "description": "Describe la tarea o consulta operativa. El sistema procesará y optimizará el flujo de negocio.",
                "name_label": "Nombre de Tarea",
                "name_placeholder": "Identifica esta operación...",
                "text_input_placeholder": "Describe lo que necesitas lograr...",
                "audio_start": "Iniciar Comando de Voz",
                "audio_stop": "Detener y Procesar",
                "file_upload": "Subir Documento",
                "processing": "Analizando contexto operativo...",
                "success": "Análisis completo. Optimización aplicada."
            },
            "colors": {
                "title": "Paleta de Colores",
                "subtitle": "Sistema de diseño completo con tokens semánticos que se adaptan automáticamente al modo claro y oscuro.",
                "backgrounds": "Fondos (Backgrounds)",
                "foregrounds": "Textos (Foregrounds)",
                "brand_colors": "Colores de Marca",
                "system_buttons": "Botones del Sistema",
                "borders": "Bordes",
                "gradients": "Gradientes",
                "tags_badges": "Tags y Badges",
                "raw_palette": "Paleta Base (Raw Tokens)",
                "bg_canvas": "Canvas",
                "bg_canvas_desc": "Fondo principal de la aplicación",
                "bg_surface": "Surface",
                "bg_surface_desc": "Superficies con glassmorphism",
                "bg_muted": "Muted",
                "bg_muted_desc": "Fondos secundarios",
                "fg_default": "Default",
                "fg_default_desc": "Texto principal",
                "fg_muted": "Muted",
                "fg_muted_desc": "Texto secundario",
                "fg_accent": "Accent",
                "fg_accent_desc": "Texto de acento",
                "fg_inverted": "Inverted",
                "fg_inverted_desc": "Texto invertido",
                "fg_brand": "Brand",
                "fg_brand_desc": "Texto de marca",
                "brand_primary": "Primary",
                "brand_primary_desc": "Color primario verde",
                "brand_secondary": "Secondary",
                "brand_secondary_desc": "Color secundario púrpura",
                "brand_accent": "Accent",
                "brand_accent_desc": "Color de acento cyan",
                "button_primary_normal": "Botón Primario - Normal",
                "button_primary_hover": "Botón Primario - Hover",
                "border_subtle": "Border Subtle",
                "gradient_glass": "Glass Gradient",
                "green_system": "Green (Sistema)",
                "cyan_umine": "Cyan (Umine)",
                "slate_neutrals": "Slate (Neutrales)"
            },
            "glass": {
                "title": "Efectos Glassmorphism",
                "subtitle": "El corazón de Umine. El efecto de vidrio esmerilado crea separación contextual sin bloquear el fondo, permitiendo jerarquías profundas y orgánicas.",
                "card_title": "Full Glass",
                "card_desc": "Este componente utiliza `backdrop-blur-xl` y un borde semitransparente para separarse del fondo de manera premium.",
                "card_btn": "Interactuar",
                "feat1_title": "Backdrop Blur",
                "feat1_desc": "Suaviza el fondo para enfocar el contenido principal sin perder contexto.",
                "feat2_title": "Vibrant Borders",
                "feat2_desc": "Bordes cristalinos que capturan la luz y definen la forma del componente.",
                "feat3_title": "Dynamic Shadows",
                "feat3_desc": "Sombras suaves que respetan la transparencia y profundidad del sistema."
            },
            "agent": {
                "title": "Prompt para Agente",
                "subtitle": "Copia este prompt y adjúntalo a tu agente programador para asegurar que cualquier desarrollo futuro cumpla con estos estándares.",
                "copy_btn": "Copiar Prompt",
                "footer": "Copia este bloque y pégalo en la configuración de sistema de tu Agente.",
                "prompt_content": "**SISTEMA DE DISEÑO CORE - INSTRUCCIONES PARA AGENTE**\n\nACTUAR COMO: Experto Diseñador UI/UX & Desarrollador Frontend especializado en interfaces \"Glassmorphism\" y \"Premium Access\".\n\nCONTEXTO: Estás construyendo interfaces para una plataforma premium. La marca se define por un estilo minimalista, sofisticado, con uso intensivo de Glassmorphism (efecto vidrio), soporte nativo para Modo Claro/Oscuro y tipografía limpia.\n\nREGLAS DE DISEÑO OBLIGATORIAS:\n\n1. **Colores Base & Fondo:**\n   - NUNCA uses fondos planos sólidos (#FFF o #000). Usa gradientes muy sutiles o blobs de color desenfocados en el fondo para que el efecto vidrio funcione.\n   - Modo Claro: Fondo Slate-50, Texto Slate-800.\n   - Modo Oscuro: Fondo Slate-900, Texto Slate-100.\n   - Primario: Utiliza el color de marca primario específico para las acciones principales.\n\n2. **Glassmorphism (El estándar):**\n   - Todos los contenedores (tarjetas, sidebar, modales) deben ser translúcidos.\n   - Clase CSS (Chakra UI) Light: `bg: \"whiteAlpha.700\", backdropBlur: \"lg\", border: \"1px solid\", borderColor: \"whiteAlpha.500\", boxShadow: \"sm\"`\n   - Clase CSS (Chakra UI) Dark: `bg: \"blackAlpha.600\", backdropBlur: \"xl\", border: \"1px solid\", borderColor: \"whiteAlpha.100\", boxShadow: \"2xl\"`\n   - Bordes: Siempre usa bordes de 1px con opacidad baja para definir límites.\n\n3. **Tipografía:**\n   - Encabezados: 'Outfit' (Google Fonts) - Pesos 600/700. Tracking -0.02em.\n   - Cuerpo: 'Inter' (Google Fonts) - Pesos 300/400. Legibilidad alta.\n\n4. **Interacción:**\n   - Estados Hover: No cambies solo el color. Añade una ligera traslación (`-translate-y-1`) y aumenta la sombra.\n   - Transiciones: `duration-300 ease-out` para suavidad \"Premium\".\n\n5. **Gráficos & Datos:**\n   - NO usar SVG para gráficas complejas, usar Chart.js o Canvas.\n   - Las gráficas no deben tener fondo blanco sólido; deben ser transparentes para integrarse en las tarjetas de vidrio.\n\n6. **Accesibilidad:**\n   - Asegura contraste suficiente en el texto sobre fondos borrosos.\n   - Usa etiquetas ARIA en componentes interactivos.\n\n7. **Configuración de Marca (JSON):**\n   - Si se adjunta un archivo JSON con la configuración de marca (`brand-config.json`), utiliza estrictamente los valores de `palette` y `semanticTokens` definidos allí para todos los colores. No inventes colores si ya están definidos en el JSON.\n\nFORMATO DE SALIDA:\n- Siempre genera código Chakra UI v3 usando tokens del sistema (bg.surface, border.subtle, shadow.glass)."
            },
            "playground": {
                "title": "Playground de Componentes",
                "subtitle": "Explora y copia la versión Chakra UI de nuestros componentes base.",
                "code_title": "Código Chakra UI v3",
                "code_desc": "Snippets listos para producción con tokens de Umine.",
                "copy_btn": "Copiar Snippet",
                "toast_desc": "Código Chakra UI v3 copiado al portapapeles.",
                "examples": {
                    "GlassCard": {
                        "label": "Tarjeta Glass",
                        "desc": "Contenedor base con efecto de vidrio esmerilado.",
                        "content": "Contenido del card con efecto glassmorphism premium."
                    },
                    "BadgesStatus": {
                        "label": "Badges & Estados",
                        "desc": "Indicadores de estado y etiquetas categorizadoras.",
                        "active": "Sistema Activo"
                    },
                    "PremiumTabs": {
                        "label": "Tabs Premium",
                        "desc": "Sistema de pestañas para navegación interna.",
                        "overview_desc": "Información general del proyecto."
                    },
                    "Accordion": {
                        "label": "Acordeón FAQ",
                        "desc": "Lista desplegable para contenido colapsable.",
                        "question": "¿Cómo funciona?",
                        "answer": "Utiliza una combinación de opacidad reducida y desenfoque de fondo."
                    },
                    "GlassInput": {
                        "label": "Input Glass",
                        "desc": "Entrada de texto con iconos y profundidad."
                    },
                    "DataTable": {
                        "label": "Tabla de Datos",
                        "desc": "Tabla estilizada para visualización de registros."
                    },
                    "ProgressKbd": {
                        "label": "Kbd & Progreso",
                        "desc": "Atajos de teclado y barras de carga."
                    }
                }
            },
            "notifications": {
                "success_title": "Acción Exitosa",
                "error_title": "Error Detectado",
                "warning_title": "Atención Requerida",
                "operation_success": "La operación '{{name}}' se completó exitosamente.",
                "operation_error": "Error al completar la operación. Por favor reintenta más tarde.",
                "operation_warning": "La operación se completó con advertencias.",
                "item_deleted": "Elemento eliminado exitosamente."
            },
            "notifications_page": {
                "title": "Notificaciones",
                "subtitle": "Informa y guía al usuario sin interrumpir su flujo. Nuestro sistema estandariza el feedback a través de alertas, toasts y banners contextuales.",
                "intro_title": "Marco Conceptual",
                "intro_desc": "Las notificaciones son señales semánticas. Cada mensaje debe tener un propósito claro: confirmar una acción, advertir sobre un riesgo o reportar un estado del sistema. Siguen el principio 'Umine': visibles pero no intrusivas.",
                "types": {
                    "title": "Tipos Semánticos",
                    "success": "Éxito",
                    "success_desc": "Usa para acciones completadas (ej. 'Operación completada'). Los colores gravitan hacia esmeralda y menta.",
                    "info": "Información",
                    "info_desc": "Usa para actualizaciones neutrales no bloqueantes. Tonos azules y cian bajo efecto cristal.",
                    "warning": "Advertencia",
                    "warning_desc": "Usa para acciones que requieren atención pero no son errores. Paleta ámbar y oro.",
                    "error": "Error",
                    "error_desc": "Usa para fallos o acciones bloqueadas. Tonos carmesí y rosa con alto contraste.",
                    "loading": "Cargando",
                    "loading_desc": "Usa para procesos asíncronos. Animaciones sutiles con barras de progreso del sistema."
                },
                "components": {
                    "title": "Componentes Principales",
                    "toast_title": "Notificaciones Toast",
                    "toast_desc": "Mensajes efímeros que aparecen en la esquina inferior derecha. Ideal para feedback de acciones.",
                    "alert_title": "Alertas Inline",
                    "alert_desc": "Componentes persistentes dentro del layout. Usados para contexto de página o sección.",
                    "banner_title": "Notificaciones Banner",
                    "banner_desc": "Alertas a ancho completo que demandan atención inmediata al inicio del viewport."
                },
                "ux_rules": {
                    "title": "Comportamiento y Reglas UX",
                    "duration_label": "Duración Recomendada",
                    "timeout_success": "Éxito: 3-5 segundos",
                    "timeout_error": "Error: Persistente o 10+ segundos",
                    "stacking_label": "Apilamiento",
                    "stacking_desc": "Máximo 3 toasts visibles a la vez. Los mensajes antiguos se descartan para dar espacio.",
                    "accessibility_label": "Accesibilidad",
                    "accessibility_desc": "Todas las notificaciones incluyen alertas ARIA y ratios de contraste adecuados para superficies glass."
                },
                "playground": {
                    "title": "Playground de Notificaciones",
                    "show_success": "Lanzar Toast de Éxito",
                    "show_info": "Lanzar Toast de Información",
                    "show_warning": "Lanzar Toast de Advertencia",
                    "show_error": "Lanzar Toast de Error",
                    "show_loading": "Lanzar Toast de Carga"
                }
            },
            "crm": {
                "add_customer": "Agregar Cliente",
                "edit_customer": "Editar Cliente",
                "customer_details": "Detalles del Cliente",
                "basic_info": "Información Básica",
                "management_info": "Gestión y Seguimiento",
                "platform_info": "Plataforma y Accesos",
                "contact_info": "Contacto Principal",
                "fields": {
                    "name": "Nombre Cliente",
                    "industry": "Industria",
                    "status": "Estado",
                    "otic": "OTIC",
                    "client_type": "Tipo de Cliente",
                    "segment": "Segmento",
                    "comercial_manager": "Comercial a Cargo",
                    "comercial_contact": "Contacto Comercial",
                    "coordinator_manager": "Coordinador a Cargo",
                    "coordinator_contact": "Contacto Coordinador",
                    "platform_type": "Plataforma",
                    "domain": "Dominio / URL",
                    "admin_username": "Admin",
                    "password": "Password",
                    "app_name": "App",
                    "report_url": "URL Reporte",
                    "institution_id": "ID Institución",
                    "phone": "Teléfono",
                    "address": "Dirección",
                    "website": "Sitio Web",
                    "tax_id": "RUT Empresa",
                    "email": "Correo Electrónico",
                    "customer_since": "Cliente Desde",
                    "role": "Cargo",
                    "contact": "Contacto",
                    "reference": "Referencia",
                    "amount": "Monto",
                    "date": "Fecha",
                    "course": "Curso",
                    "account_manager": "Ejecutivo Comercial"
                },
                "industry_labels": {
                    "Retail": "Retail",
                    "Minería": "Minería",
                    "Banca": "Banca",
                    "Bebidas": "Bebidas",
                    "Educación": "Educación",
                    "Tecnología": "Tecnología",
                    "Salud": "Salud",
                    "Seguros": "Seguros",
                    "Servicios": "Servicios",
                    "Otro": "Otro"
                },
                "status_labels": {
                    "CLIENTE ACTIVO": "CLIENTE ACTIVO",
                    "CLIENTE INACTIVO": "CLIENTE INACTIVO",
                    "DADO DE BAJA": "DADO DE BAJA",
                    "ALIANZA": "ALIANZA"
                },
                "client_type_labels": {
                    "Cliente Plataforma": "Cliente Plataforma",
                    "Cliente Spot": "Cliente Spot",
                    "Cliente Contenidos": "Cliente Contenidos",
                    "Plataforma Bloqueada": "Plataforma Bloqueada"
                },
                "platform_type_labels": {
                    "PLATAFORMA PROPIA": "Plataforma Propia",
                    "SIN PLATAFORMA": "Sin Plataforma"
                },
                "tabs": {
                    "dashboard": "Dashboard",
                    "contacts": "Directorio",
                    "pos": "Ordenes de Compra",
                    "billing": "Facturación",
                    "aliases": "Alias"
                },
                "headers": {
                    "tax_data": "Datos Tributarios",
                    "billing_channel": "Canal de Facturación"
                },
                "kpis": {
                    "total_pos": "POs Realizadas",
                    "avg_ticket": "Ticket Promedio",
                    "active_projects": "Proyectos Activos",
                    "history_chart": "Gráfico de actividad histórica del cliente"
                },
                "billing_info": {
                    "payment_method": "Método de Pago",
                    "pending_docs": "Documentos Pendientes"
                },
                "alias_management": {
                    "title": "Gestión de Alias",
                    "subtitle": "Gestiona nombres alternativos para patrones de búsqueda",
                    "placeholder": "Agregar tags (separados por coma)",
                    "add_btn": "Agregar",
                    "no_aliases": "Aún no hay alias definidos."
                },
                "account_manager_modal": {
                    "title": "Información del Ejecutivo",
                    "send_email": "Enviar Email",
                    "send_whatsapp": "Enviar WhatsApp",
                    "call": "Llamar",
                    "close": "Cerrar"
                }
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

// Persistence with localforage
i18n.on('languageChanged', (lng) => {
    localforage.setItem('user-language', lng);
});

// Load saved language on startup
localforage.getItem('user-language').then((lng) => {
    if (lng) {
        i18n.changeLanguage(lng as string);
    }
});

export default i18n;
