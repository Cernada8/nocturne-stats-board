import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, BarChart3, TrendingUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ArgosAI = () => {
  const navigate = useNavigate();
  const { userEmail, companyId, setCompanyId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchCompanyId = async () => {
    try {
      const response = await apiFetch(`/api/info/getIdEmpresa?email=${userEmail}`);
      if (!response.ok) throw new Error('Error al obtener ID de empresa');
      
      const result = await response.json();
      setCompanyId(result.data.company_id.toString());
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !companyId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          company_id: parseInt(companyId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error('Error al obtener respuesta');
      }

      const result = await response.json();
      console.log('Respuesta completa del servidor:', result);
      
      const answerText = result.data?.answer || result.answer || 'Lo siento, no pude procesar tu pregunta.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('Respuesta de ArgosAI:', answerText);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al comunicarse con ArgosAI');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    const formatted: string[] = [];
    let inList = false;
    
    lines.forEach((line) => {
      let trimmedLine = line.trim();
      
      if (!trimmedLine) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        formatted.push('<div class="mb-3"></div>');
        return;
      }
      
      // Headers
      if (trimmedLine.startsWith('### ')) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const text = trimmedLine.substring(4);
        formatted.push('<h3 class="text-lg font-semibold text-cyan-300 mt-4 mb-2">' + text + '</h3>');
        return;
      }
      
      if (trimmedLine.startsWith('## ')) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const text = trimmedLine.substring(3);
        formatted.push('<h2 class="text-xl font-semibold text-cyan-300 mt-4 mb-2">' + text + '</h2>');
        return;
      }
      
      if (trimmedLine.startsWith('# ')) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const text = trimmedLine.substring(2);
        formatted.push('<h1 class="text-2xl font-bold text-cyan-300 mt-4 mb-2">' + text + '</h1>');
        return;
      }
      
      // Bold text
      let processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-semibold">$1</strong>');
      
      // Italic text
      processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em class="text-white/80 italic">$1</em>');
      
      // Inline code
      processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-slate-800/50 text-cyan-300 px-2 py-0.5 rounded text-sm font-mono">$1</code>');
      
      // Bullet lists
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          formatted.push('<ul class="list-none space-y-2 my-3">');
          inList = true;
        }
        const text = processedLine.substring(2);
        formatted.push('<li class="flex gap-3 items-start"><span class="text-cyan-400 mt-1.5">•</span><span class="flex-1">' + text + '</span></li>');
        return;
      }
      
      // Numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const number = numberedMatch[1];
        const text = processedLine.replace(/^\d+\.\s+/, '');
        formatted.push('<div class="flex gap-3 my-2 items-start"><span class="text-cyan-400 font-semibold">' + number + '.</span><span class="flex-1">' + text + '</span></div>');
        return;
      }
      
      // Regular paragraph
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      
      formatted.push('<div class="mb-3 leading-relaxed">' + processedLine + '</div>');
    });
    
    if (inList) {
      formatted.push('</ul>');
    }
    
    return formatted.join('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3 lg:gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 blur-lg rounded-full"></div>
                <img 
                  src="/assets/ArgosAI_logo.png" 
                  alt="ArgosAI" 
                  className="relative h-10 w-10 lg:h-12 lg:w-12 rounded-full border-2 border-cyan-400/50 object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  ArgosAI
                </h1>
                <p className="text-xs lg:text-sm text-white/60 hidden sm:block">
                  Asistente de Análisis Inteligente
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/70">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {messages.length === 0 ? (
          // Empty State
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center max-w-2xl mx-auto px-4">
              <div className="relative inline-block mb-6 lg:mb-8">
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
                <Sparkles className="relative h-16 w-16 lg:h-20 lg:w-20 text-cyan-400" />
              </div>
              
              <h2 className="text-2xl lg:text-4xl font-bold text-white mb-3 lg:mb-4">
                Bienvenido a ArgosAI
              </h2>
              
              <p className="text-base lg:text-lg text-white/60 mb-8 lg:mb-12">
                Este asistente no tiene memoria (has de dar contexto en cada pregunta).<br />
              </p>

              <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 text-left">
                <div className="p-4 lg:p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <BarChart3 className="h-8 w-8 text-cyan-400 mb-3" />
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-2">
                    Análisis de Sentimiento
                  </h3>
                  <p className="text-sm text-white/60">
                    Consulta el sentimiento de las menciones en tiempo real
                  </p>
                </div>

                <div className="p-4 lg:p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-2">
                    Estadísticas
                  </h3>
                  <p className="text-sm text-white/60">
                    Obtén métricas detalladas sobre fuentes y alcance
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Messages Area
          <div className="flex-1 overflow-y-auto py-6 lg:py-8 space-y-6 lg:space-y-8 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 lg:gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                } animate-fade-in max-w-4xl ${
                  message.role === 'user' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {message.role === 'assistant' ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full"></div>
                      <img 
                        src="/assets/ArgosAI_logo.png" 
                        alt="ArgosAI" 
                        className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full border-2 border-cyan-400/50 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                      {userEmail?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-sm font-medium text-white">
                      {message.role === 'assistant' ? 'ArgosAI' : 'Tú'}
                    </span>
                    <span className="text-xs text-white/40">
                      {message.timestamp.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div
                    className={`rounded-2xl p-4 lg:p-6 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30'
                        : 'bg-slate-800/40 border border-white/10'
                    }`}
                  >
                    <div 
                      className="text-sm lg:text-base leading-relaxed text-white/90"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 lg:gap-4 animate-fade-in max-w-4xl">
                <div className="shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full"></div>
                    <img 
                      src="/assets/ArgosAI_logo.png" 
                      alt="ArgosAI" 
                      className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full border-2 border-cyan-400/50 object-cover"
                    />
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-white/10 p-4 lg:p-6 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin text-cyan-400" />
                    <span className="text-sm lg:text-base text-white/70">Analizando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 py-4 lg:py-6 bg-slate-950/95">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-lg"></div>
              
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 lg:p-4 shadow-2xl">
                <div className="flex gap-2 lg:gap-3 items-end">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-transparent border-0 focus:outline-none text-white placeholder:text-white/40 text-sm lg:text-base resize-none max-h-[120px] py-2"
                    rows={1}
                    disabled={isLoading || !companyId}
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim() || !companyId}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl px-4 lg:px-6 h-10 lg:h-12 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5 lg:mr-2" />
                        <span className="hidden lg:inline">Enviar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-white/40 mt-3 text-center">
              ArgosAI puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArgosAI;