import { Instagram, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white">AA</span>
              </div>
              <span className="text-primary">Amalia Abogabir</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Nutricionista Deportiva especializada en recomposición corporal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-foreground">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Planes
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Sobre Amalia
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Testimonios
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-foreground">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contacto@amalia.cl</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>WhatsApp: +56 9 XXXX XXXX</span>
              </div>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 Amalia Abogabir. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
