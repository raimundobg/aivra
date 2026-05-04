import { useState } from "react";
import { Send, Bot, User as UserIcon, Image as ImageIcon, Paperclip } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

interface ChatPageProps {
  onNavigate: (page: string) => void;
}

export function ChatPage({ onNavigate }: ChatPageProps) {
  const [message, setMessage] = useState("");
  
  const messages = [
    {
      id: 1,
      sender: "system",
      text: "Bienvenida al chat. Amalia responde en 24-48 hrs según tu plan.",
      time: "10:00"
    },
    {
      id: 2,
      sender: "user",
      text: "Hola Amalia! Tengo una duda sobre las porciones de carbohidratos. ¿Puedo aumentar un poco el arroz en el almuerzo si voy a entrenar?",
      time: "10:15"
    },
    {
      id: 3,
      sender: "ai",
      text: "¡Hola! Claro que sí. Si vas a entrenar en la tarde, es perfectamente válido aumentar 30-50g de arroz en el almuerzo. Esto te dará más energía para tu sesión. ¿A qué hora sueles entrenar?",
      time: "10:17"
    },
    {
      id: 4,
      sender: "user",
      text: "Entreno a las 18:00 hrs, después del trabajo. Perfecto, entonces añadiré esa porción extra.",
      time: "10:20"
    },
    {
      id: 5,
      sender: "amalia",
      text: "Excelente María! 💪 Sí, con el entrenamiento a esa hora, esa estrategia es ideal. También asegúrate de tomar tu colación PM 1 hora antes de entrenar. ¿Cómo vas con el peso y la energía en general?",
      time: "14:30",
      isAmalia: true
    },
    {
      id: 6,
      sender: "user",
      text: "¡Muy bien! Ya bajé 3kg y me siento con mucha energía. El plan es súper fácil de seguir.",
      time: "14:45"
    },
    {
      id: 7,
      sender: "amalia",
      text: "¡Wow, qué increíble progreso! 🎉 Me encanta que te sientas con energía, eso significa que estamos en el punto perfecto. Sigamos así. En tu próximo check-in evaluaremos si necesitamos hacer algún ajuste. ¡Vas excelente!",
      time: "15:00",
      isAmalia: true
    }
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Here would be the logic to send the message
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl text-foreground mb-2">
                Chat con Amalia
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <p className="text-sm text-muted-foreground">
                  Respuesta en 24-48 hrs
                </p>
              </div>
            </div>
            <Badge className="bg-accent text-white">
              Plan con Seguimiento
            </Badge>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="border-border overflow-hidden flex flex-col h-[calc(100vh-280px)]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {msg.sender !== 'system' && (
                  <Avatar className={`w-10 h-10 flex-shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-primary' 
                      : msg.isAmalia 
                      ? 'bg-accent'
                      : 'bg-muted'
                  }`}>
                    <AvatarFallback className="text-white">
                      {msg.sender === 'user' ? (
                        <UserIcon className="h-5 w-5" />
                      ) : msg.isAmalia ? (
                        'AA'
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col max-w-[70%] ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {msg.sender !== 'system' && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {msg.sender === 'user' 
                          ? 'Tú' 
                          : msg.isAmalia 
                          ? 'Amalia Abogabir'
                          : 'Asistente IA'}
                      </span>
                      {msg.isAmalia && (
                        <Badge variant="outline" className="text-xs h-5 px-2 border-accent text-accent">
                          Profesional
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === 'system'
                        ? 'bg-muted text-muted-foreground text-center text-sm mx-auto'
                        : msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : msg.isAmalia
                        ? 'bg-accent/10 text-foreground border border-accent/20 rounded-tl-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-white">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 rounded-full"
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 rounded-full"
              >
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div className="flex-1">
                <Input
                  placeholder="Escribe tu mensaje..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="bg-muted border-0 rounded-full"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex-shrink-0 rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Los mensajes urgentes tienen respuesta prioritaria en planes Premium
            </p>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Card className="p-4 border-border bg-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm mb-1">Asistente IA</p>
                <p className="text-xs text-muted-foreground">
                  Respuestas instantáneas entrenadas por Amalia para consultas comunes
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border bg-accent/5 border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent">AA</span>
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm mb-1">Amalia Abogabir</p>
                <p className="text-xs text-muted-foreground">
                  Respuestas personalizadas según tu plan y necesidades específicas
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
